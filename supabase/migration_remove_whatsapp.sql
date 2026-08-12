-- Run this directly in Supabase's SQL Editor.
--
-- Removes WhatsApp entirely from the schema, matching the code changes
-- that removed it from the actual lead flow. The Interest Form no longer
-- redirects anywhere - it goes straight to the Intent Form (with an
-- inline OTP step first, for leads from an affiliate who isn't yet
-- Trusted). Nothing in the app reads or writes these columns anymore.

alter table businesses drop column if exists whatsapp_number;
alter table affiliate_programs drop column if exists whatsapp_number;

-- Rename leads.whatsapp_ref to lead_ref - it was always just a reference
-- code identifying the lead, not something tied to WhatsApp specifically,
-- but the old name was inconsistent with everything else once WhatsApp
-- was removed from the actual flow.
alter table leads rename column whatsapp_ref to lead_ref;
alter index if exists idx_leads_whatsapp_ref rename to idx_leads_lead_ref;
