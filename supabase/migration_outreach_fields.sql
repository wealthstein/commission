-- Run in Supabase's SQL Editor. Safe to run even if some of this already
-- happened - checks before acting.

alter table cold_outreach_contacts add column if not exists last_name text;
alter table cold_outreach_contacts drop column if exists company_name;
