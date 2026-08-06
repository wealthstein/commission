-- Run this in Supabase's SQL Editor. Safe to run even if this table
-- somehow already partially exists (uses "if not exists" throughout).

create table if not exists cold_outreach_contacts (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  company_name  text,
  sequence_step int not null default 0,
  status        text not null default 'active' check (status in ('active', 'replied', 'completed', 'bounced')),
  last_sent_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_outreach_status on cold_outreach_contacts(status);

alter table cold_outreach_contacts enable row level security;
-- No public policies - this table is only ever touched by the admin client
-- (the cron route and the inbound-reply webhook), never by an end user.
