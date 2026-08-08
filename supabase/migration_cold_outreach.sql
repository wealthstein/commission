-- Run in Supabase's SQL Editor.
--
-- CASE A: you have NOT run any earlier version of this table yet.
-- Just run the CREATE TABLE block below - safe as-is.
--
-- CASE B: you already created cold_outreach_contacts with the old
-- columns (email, no first_name). Run the ALTER block instead - it
-- renames email -> email_address and adds first_name, keeping your
-- existing 300 rows and their sequence progress intact.

-- ---- CASE A: fresh create ----
create table if not exists cold_outreach_contacts (
  id             uuid primary key default gen_random_uuid(),
  email_address  text not null unique,
  first_name     text,
  company_name   text,
  sequence_step  int not null default 0,
  status         text not null default 'active' check (status in ('active', 'replied', 'completed', 'bounced')),
  last_sent_at   timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists idx_outreach_status on cold_outreach_contacts(status);

alter table cold_outreach_contacts enable row level security;
-- No public policies - this table is only ever touched by the admin client
-- (the cron route and the inbound-reply webhook), never by an end user.

-- ---- CASE B: table already exists with the old "email" column ----
-- Uncomment and run this block INSTEAD of the CREATE TABLE above if you
-- already imported your 300 contacts under the old schema.
--
-- alter table cold_outreach_contacts rename column email to email_address;
-- alter table cold_outreach_contacts add column if not exists first_name text;
