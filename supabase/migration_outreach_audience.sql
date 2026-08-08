-- Run in Supabase's SQL Editor. Safe to run even if this already exists.
alter table cold_outreach_contacts add column if not exists audience text not null default 'business' check (audience in ('business', 'affiliate'));
create index if not exists idx_outreach_audience on cold_outreach_contacts(audience);

-- When importing your ~100 real estate agents via Table Editor CSV
-- import, make sure the audience column is set to 'affiliate' for those
-- rows (add an "audience" column to your CSV with that value, or bulk-
-- update after import with something like:
--   update cold_outreach_contacts set audience = 'affiliate' where email_address in (...);
