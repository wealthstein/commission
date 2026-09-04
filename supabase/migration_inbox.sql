-- ============================================================================
-- INBOX — WhatsApp team inbox + lightweight CRM, layered onto Commission's
-- existing multi-tenant model. Run this after schema.sql.
--
-- Deliberately does NOT touch: users, businesses, business_team_members,
-- leads, customers, or anything OTP/Sendchamp-related. Inbox's own
-- "pipeline lead" concept is a different thing from Commission's `leads`
-- table (which is an affiliate-attribution/billing record that is
-- deliberately PII-free) — so every Inbox table gets an inbox_ prefix to
-- keep the two concepts from ever being confused in code or in the
-- database itself.
--
-- Tenancy: every table below is scoped by business_id, the same tenant
-- Commission already uses everywhere else. "Membership" reuses
-- business_team_members (status='active') plus businesses.owner_id — no
-- separate org/invite system is introduced.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Helper: is the current authenticated user (users.id, resolved via
-- auth_user_id) allowed to act on this business — owner, or active team
-- member? Mirrors the inline subquery already used throughout schema.sql
-- (see business_team_members' own RLS policies) but pulled into one
-- function so the ~8 tables below don't each repeat it.
-- ----------------------------------------------------------------------------
create or replace function is_business_member(check_business_id uuid)
returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from businesses b
    where b.id = check_business_id
      and b.owner_id in (select id from users where auth_user_id = auth.uid())
  )
  or exists (
    select 1 from business_team_members btm
    where btm.business_id = check_business_id
      and btm.status = 'active'
      and btm.user_id in (select id from users where auth_user_id = auth.uid())
  );
$$;

create or replace function current_users_id()
returns uuid
language sql security definer stable as $$
  select id from users where auth_user_id = auth.uid();
$$;

-- ============================================================================
-- WHATSAPP CONNECTIONS
-- ============================================================================

create table if not exists inbox_whatsapp_connections (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  label           text not null default 'Main line',
  phone_number    text,
  status          text not null default 'pending' check (status in ('pending','qr_ready','connected','disconnected','error')),
  qr_data         text,
  session_ref     text,
  last_seen_at    timestamptz,
  connected_by    uuid references users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_inbox_connections_business on inbox_whatsapp_connections(business_id);

-- ============================================================================
-- CONTACTS, CONVERSATIONS, MESSAGES
-- ============================================================================

create table if not exists inbox_contacts (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  wa_number       text not null,
  name            text,
  avatar_url      text,
  notes           text,
  created_at      timestamptz not null default now(),
  unique (business_id, wa_number)
);

create index if not exists idx_inbox_contacts_business on inbox_contacts(business_id);

create table if not exists inbox_conversations (
  id                    uuid primary key default gen_random_uuid(),
  business_id           uuid not null references businesses(id) on delete cascade,
  connection_id         uuid not null references inbox_whatsapp_connections(id) on delete cascade,
  contact_id            uuid not null references inbox_contacts(id) on delete cascade,
  assigned_to           uuid references users(id),
  status                text not null default 'open' check (status in ('open','pending','closed')),
  last_message_at       timestamptz,
  last_message_preview  text,
  unread_count          int not null default 0,
  created_at            timestamptz not null default now(),
  unique (connection_id, contact_id)
);

create index if not exists idx_inbox_conversations_business on inbox_conversations(business_id);
create index if not exists idx_inbox_conversations_assigned on inbox_conversations(assigned_to);
create index if not exists idx_inbox_conversations_last_msg on inbox_conversations(last_message_at desc);

create table if not exists inbox_messages (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  conversation_id   uuid not null references inbox_conversations(id) on delete cascade,
  direction         text not null check (direction in ('inbound','outbound')),
  sender_user_id    uuid references users(id),
  type              text not null default 'text' check (type in ('text','image','video','audio','document','sticker','location','system')),
  content           text,
  media_url         text,
  media_mime_type   text,
  wa_message_id     text,
  status            text not null default 'sent' check (status in ('pending','sent','delivered','read','failed')),
  created_at        timestamptz not null default now()
);

create index if not exists idx_inbox_messages_conversation on inbox_messages(conversation_id, created_at);
create index if not exists idx_inbox_messages_business on inbox_messages(business_id);
create unique index if not exists idx_inbox_messages_wa_id on inbox_messages(wa_message_id) where wa_message_id is not null;

alter table inbox_messages add column if not exists search_vector tsvector
  generated always as (to_tsvector('english', coalesce(content, ''))) stored;

create index if not exists idx_inbox_messages_search on inbox_messages using gin(search_vector);

create or replace function inbox_search_messages(search_business_id uuid, search_query text)
returns table (
  message_id uuid,
  conversation_id uuid,
  contact_name text,
  contact_wa_number text,
  snippet text,
  created_at timestamptz
)
language sql security definer stable as $$
  select
    m.id, m.conversation_id, c.name, c.wa_number,
    ts_headline('english', coalesce(m.content, ''), plainto_tsquery('english', search_query),
                E'StartSel=\x01, StopSel=\x02, MaxFragments=1, MaxWords=20'),
    m.created_at
  from inbox_messages m
  join inbox_conversations conv on conv.id = m.conversation_id
  join inbox_contacts c on c.id = conv.contact_id
  where m.business_id = search_business_id
    and is_business_member(search_business_id)
    and m.search_vector @@ plainto_tsquery('english', search_query)
  order by m.created_at desc
  limit 50;
$$;

-- ============================================================================
-- CRM: PIPELINE, LEADS (Inbox's own — distinct from Commission's `leads`),
-- ACTIVITIES, TASKS, INVENTORY, ROUTING
-- ============================================================================

create table if not exists inbox_pipeline_stages (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  name          text not null,
  position      int not null default 0,
  is_won        boolean not null default false,
  is_lost       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists idx_inbox_stages_business on inbox_pipeline_stages(business_id, position);

create table if not exists inbox_leads (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  contact_id        uuid not null references inbox_contacts(id) on delete cascade,
  conversation_id   uuid references inbox_conversations(id) on delete set null,
  stage_id          uuid references inbox_pipeline_stages(id) on delete set null,
  owner_id          uuid references users(id),
  source            text not null default 'whatsapp' check (source in ('whatsapp','manual','import')),
  title             text,
  value             numeric(12,2) default 0,
  currency          text not null default 'USD',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_inbox_leads_business on inbox_leads(business_id);
create index if not exists idx_inbox_leads_stage on inbox_leads(stage_id);
create index if not exists idx_inbox_leads_owner on inbox_leads(owner_id);

create table if not exists inbox_lead_activities (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  lead_id       uuid not null references inbox_leads(id) on delete cascade,
  type          text not null check (type in ('note','stage_change','call','email','whatsapp','task')),
  body          text,
  created_by    uuid references users(id),
  created_at    timestamptz not null default now()
);

create index if not exists idx_inbox_activities_lead on inbox_lead_activities(lead_id, created_at desc);

create table if not exists inbox_tasks (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  lead_id           uuid references inbox_leads(id) on delete cascade,
  conversation_id   uuid references inbox_conversations(id) on delete set null,
  assigned_to       uuid references users(id),
  title             text not null,
  description       text,
  due_at            timestamptz,
  status            text not null default 'open' check (status in ('open','done','cancelled')),
  created_by        uuid references users(id),
  created_at        timestamptz not null default now()
);

create index if not exists idx_inbox_tasks_business on inbox_tasks(business_id);
create index if not exists idx_inbox_tasks_assigned on inbox_tasks(assigned_to, status);

create table if not exists inbox_inventory_items (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  name          text not null,
  sku           text,
  description   text,
  price         numeric(12,2),
  currency      text not null default 'USD',
  quantity      int not null default 0,
  category      text,
  image_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_inbox_inventory_business on inbox_inventory_items(business_id);

create table if not exists inbox_routing_rules (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  name          text not null,
  type          text not null check (type in ('round_robin','keyword','first_available')),
  config        jsonb not null default '{}',
  priority      int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists idx_inbox_routing_business on inbox_routing_rules(business_id, priority);

-- ============================================================================
-- PUSH SUBSCRIPTIONS
-- ============================================================================

create table if not exists inbox_push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  endpoint      text not null,
  keys          jsonb not null,
  created_at    timestamptz not null default now(),
  unique (endpoint)
);

create index if not exists idx_inbox_push_business_user on inbox_push_subscriptions(business_id, user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

create trigger trg_inbox_wa_conn_updated before update on inbox_whatsapp_connections
  for each row execute function fn_touch_updated_at();
create trigger trg_inbox_leads_updated before update on inbox_leads
  for each row execute function fn_touch_updated_at();
create trigger trg_inbox_inventory_updated before update on inbox_inventory_items
  for each row execute function fn_touch_updated_at();

create or replace function inbox_touch_conversation_on_message()
returns trigger language plpgsql as $$
begin
  update inbox_conversations
  set last_message_at = new.created_at,
      last_message_preview = left(coalesce(new.content, '[' || new.type || ']'), 120),
      unread_count = case when new.direction = 'inbound' then unread_count + 1 else unread_count end
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger trg_inbox_touch_conversation after insert on inbox_messages
  for each row execute function inbox_touch_conversation_on_message();

-- ============================================================================
-- ROW LEVEL SECURITY — every table: any active member of the business
-- (owner or active business_team_members row) has full access. Same
-- membership model Commission already uses; nothing new to teach the RLS
-- layer conceptually.
-- ============================================================================

alter table inbox_whatsapp_connections enable row level security;
alter table inbox_contacts enable row level security;
alter table inbox_conversations enable row level security;
alter table inbox_messages enable row level security;
alter table inbox_pipeline_stages enable row level security;
alter table inbox_leads enable row level security;
alter table inbox_lead_activities enable row level security;
alter table inbox_tasks enable row level security;
alter table inbox_inventory_items enable row level security;
alter table inbox_routing_rules enable row level security;
alter table inbox_push_subscriptions enable row level security;

drop policy if exists inbox_connections_member on inbox_whatsapp_connections;
create policy inbox_connections_member on inbox_whatsapp_connections for all
  using (is_business_member(business_id)) with check (is_business_member(business_id));

drop policy if exists inbox_contacts_member on inbox_contacts;
create policy inbox_contacts_member on inbox_contacts for all
  using (is_business_member(business_id)) with check (is_business_member(business_id));

drop policy if exists inbox_conversations_member on inbox_conversations;
create policy inbox_conversations_member on inbox_conversations for all
  using (is_business_member(business_id)) with check (is_business_member(business_id));

drop policy if exists inbox_messages_member on inbox_messages;
create policy inbox_messages_member on inbox_messages for all
  using (is_business_member(business_id)) with check (is_business_member(business_id));

drop policy if exists inbox_stages_member on inbox_pipeline_stages;
create policy inbox_stages_member on inbox_pipeline_stages for all
  using (is_business_member(business_id)) with check (is_business_member(business_id));

drop policy if exists inbox_leads_member on inbox_leads;
create policy inbox_leads_member on inbox_leads for all
  using (is_business_member(business_id)) with check (is_business_member(business_id));

drop policy if exists inbox_activities_member on inbox_lead_activities;
create policy inbox_activities_member on inbox_lead_activities for all
  using (is_business_member(business_id)) with check (is_business_member(business_id));

drop policy if exists inbox_tasks_member on inbox_tasks;
create policy inbox_tasks_member on inbox_tasks for all
  using (is_business_member(business_id)) with check (is_business_member(business_id));

drop policy if exists inbox_inventory_member on inbox_inventory_items;
create policy inbox_inventory_member on inbox_inventory_items for all
  using (is_business_member(business_id)) with check (is_business_member(business_id));

drop policy if exists inbox_routing_admin on inbox_routing_rules;
create policy inbox_routing_admin on inbox_routing_rules for all
  using (is_business_member(business_id)) with check (is_business_member(business_id));

drop policy if exists inbox_push_own on inbox_push_subscriptions;
create policy inbox_push_own on inbox_push_subscriptions for all
  using (user_id = current_users_id()) with check (user_id = current_users_id());

drop policy if exists inbox_push_readable_for_sending on inbox_push_subscriptions;
create policy inbox_push_readable_for_sending on inbox_push_subscriptions for select
  using (is_business_member(business_id));

-- ============================================================================
-- STORAGE: bucket for inbound/outbound WhatsApp media
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('inbox-media', 'inbox-media', true)
on conflict (id) do nothing;

drop policy if exists "inbox-media readable by business members" on storage.objects;
create policy "inbox-media readable by business members"
  on storage.objects for select
  using (bucket_id = 'inbox-media' and is_business_member((storage.foldername(name))[1]::uuid));

drop policy if exists "inbox-media insertable by service role only" on storage.objects;
create policy "inbox-media insertable by service role only"
  on storage.objects for insert
  with check (bucket_id = 'inbox-media' and auth.role() = 'service_role');

-- ============================================================================
-- DEFAULT DATA HELPER
-- ============================================================================

create or replace function inbox_seed_default_pipeline(target_business_id uuid)
returns void language plpgsql as $$
begin
  insert into inbox_pipeline_stages (business_id, name, position, is_won, is_lost)
  select target_business_id, name, position, is_won, is_lost
  from (values
    ('New Lead', 0, false, false),
    ('Contacted', 1, false, false),
    ('Qualified', 2, false, false),
    ('Negotiation', 3, false, false),
    ('Won', 4, true, false),
    ('Lost', 5, false, true)
  ) as defaults(name, position, is_won, is_lost)
  where not exists (
    select 1 from inbox_pipeline_stages where business_id = target_business_id
  );
end;
$$;

-- Realtime
alter publication supabase_realtime add table inbox_messages;
alter publication supabase_realtime add table inbox_conversations;
alter publication supabase_realtime add table inbox_whatsapp_connections;
alter publication supabase_realtime add table inbox_leads;
alter publication supabase_realtime add table inbox_tasks;
