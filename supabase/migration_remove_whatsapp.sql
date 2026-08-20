-- Run this directly in Supabase's SQL Editor.
--
-- Removes WhatsApp entirely from the schema, matching the code changes
-- that removed it from the actual lead flow. The Interest Form no longer
-- redirects anywhere - it goes straight to the Intent Form (with an
-- inline OTP step first, for leads from an affiliate who isn't yet
-- Trusted). Nothing in the app reads or writes these columns anymore.
--
-- Made defensive with IF EXISTS at the table level too (not just column/
-- index level) after "relation businesses does not exist" came back on
-- the first run - that specific error means this ran against a database
-- where the businesses table isn't present at all, which is worth
-- confirming directly: check Supabase's Table Editor for this project
-- and see whether businesses shows up there. If it doesn't, this is very
-- likely the wrong Supabase project - not the one this whole build has
-- been running against all session.
--
-- With IF EXISTS added, this version will no longer crash even if run
-- against an unexpected project - but it will also do NOTHING in that
-- case, so check the notices below after running it.

do $$
begin
  if to_regclass('public.businesses') is not null then
    alter table businesses drop column if exists whatsapp_number;
    raise notice 'businesses table found - whatsapp_number column drop applied (or already absent)';
  else
    raise notice 'businesses table NOT FOUND in this database - nothing changed. Check you are in the right Supabase project.';
  end if;

  if to_regclass('public.affiliate_programs') is not null then
    alter table affiliate_programs drop column if exists whatsapp_number;
    raise notice 'affiliate_programs table found - whatsapp_number column drop applied (or already absent)';
  else
    raise notice 'affiliate_programs table NOT FOUND in this database - nothing changed.';
  end if;

  if to_regclass('public.leads') is not null then
    if exists (select 1 from information_schema.columns where table_name = 'leads' and column_name = 'whatsapp_ref') then
      alter table leads rename column whatsapp_ref to lead_ref;
      raise notice 'leads.whatsapp_ref renamed to lead_ref';
    else
      raise notice 'leads table found, but whatsapp_ref column already absent (maybe already renamed) - nothing changed here';
    end if;
    alter index if exists idx_leads_whatsapp_ref rename to idx_leads_lead_ref;
  else
    raise notice 'leads table NOT FOUND in this database - nothing changed.';
  end if;
end $$;
