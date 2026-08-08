-- Run this directly - no editing needed. Safe to run even if some of
-- these already happened (checks before acting).

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'cold_outreach_contacts' and column_name = 'email'
  ) then
    alter table cold_outreach_contacts rename column email to email_address;
  end if;
end $$;

alter table cold_outreach_contacts add column if not exists first_name text;
