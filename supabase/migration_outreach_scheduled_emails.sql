-- Run this directly in Supabase's SQL Editor.
--
-- Supports the new scheduled-email architecture for cold outreach: all 5
-- emails get scheduled with Resend upfront, the moment a contact is added
-- (email 1 immediate, 2-5 scheduled via Resend's own scheduled_at
-- parameter for day 3/6/9/12). Resend holds and fires them automatically -
-- no daily cron, no external scheduler dependency for new contacts.
--
-- These columns store the Resend email IDs for the 4 not-yet-sent emails,
-- so a reply can actually cancel them via Resend's cancel-email endpoint,
-- rather than just flipping a status flag a cron would have checked.
-- email_1_resend_id is for reference/debugging only, not cancellation -
-- email 1 sends immediately with no scheduled_at, so by the time any
-- reply could possibly arrive it has already gone out. Stored anyway so
-- the full sequence's Resend IDs are all on record in one place.
alter table cold_outreach_contacts add column if not exists email_1_resend_id text;
alter table cold_outreach_contacts add column if not exists email_2_resend_id text;
alter table cold_outreach_contacts add column if not exists email_3_resend_id text;
alter table cold_outreach_contacts add column if not exists email_4_resend_id text;
alter table cold_outreach_contacts add column if not exists email_5_resend_id text;
