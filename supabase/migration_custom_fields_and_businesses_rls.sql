-- Run this directly in Supabase's SQL Editor.
--
-- Fixes two things:
-- 1. "Could not find the table 'public.campaign_custom_fields' in the
--    schema cache" - that table was never actually created on your live
--    database. Creating it now.
-- 2. Discover showing no campaigns to other users - businesses had no
--    public-read RLS policy at all, only an owner-only one. Added a
--    scoped public-read policy (only businesses running a live campaign
--    are visible this way, not every business).

create table if not exists campaign_custom_fields (
  id                    uuid primary key default gen_random_uuid(),
  affiliate_program_id  uuid not null references affiliate_programs(id) on delete cascade,
  label                 text not null,
  field_type            text not null default 'text' check (field_type in ('text', 'select', 'price', 'number')),
  options               jsonb,
  required              boolean not null default false,
  display_order         int not null default 0,
  created_at            timestamptz not null default now()
);

create index if not exists idx_custom_fields_program on campaign_custom_fields(affiliate_program_id);

alter table campaign_custom_fields enable row level security;

drop policy if exists custom_fields_select on campaign_custom_fields;
create policy custom_fields_select on campaign_custom_fields for select
  using (true); -- public - the Intent Form page needs to read these for an anonymous prospect

drop policy if exists custom_fields_manage on campaign_custom_fields;
create policy custom_fields_manage on campaign_custom_fields for all
  using (
    affiliate_program_id in (
      select ap.id from affiliate_programs ap
      join products p on p.id = ap.product_id
      join businesses b on b.id = p.business_id
      where b.owner_id in (select id from users where auth_user_id = auth.uid())
    )
  );

-- Businesses: scoped public read - only businesses with a live campaign
-- become visible this way, not every business row in the table.
drop policy if exists businesses_public_read on businesses;
create policy businesses_public_read on businesses for select
  using (
    id in (
      select p.business_id from products p
      join affiliate_programs ap on ap.product_id = p.id
      where ap.status = 'active'
    )
  );
