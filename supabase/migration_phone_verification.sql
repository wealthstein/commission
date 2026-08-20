-- Run this directly in Supabase's SQL Editor.
--
-- Adds phone verification to every user account - required before the
-- dashboard is usable at all (see middleware.js). This is what makes the
-- "a customer's phone can't match a registered user's own verified phone"
-- fraud check possible - it needs a trustworthy phone on file for every
-- affiliate, not just for leads.

alter table users add column if not exists phone_verified boolean not null default false;
alter table users add column if not exists phone_otp_pin_id text;
alter table users add column if not exists phone_otp_expires_at timestamptz;
