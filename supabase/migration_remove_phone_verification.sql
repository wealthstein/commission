-- Run this directly in Supabase's SQL Editor.
--
-- Account phone verification has been removed from the app entirely - not
-- just disabled. This drops the columns it used from an existing
-- database. The phone field itself is untouched and still fully
-- functional (still editable on the Account page, still used by the
-- same-number fraud check in the lead capture routes) - only the
-- verification mechanism and its two supporting columns are gone.
--
-- Safe to run even if these columns were never actually created on this
-- database (the earlier migration_phone_verification.sql, which this
-- replaces).

alter table users drop column if exists phone_verified;
alter table users drop column if exists phone_otp_pin_id;
alter table users drop column if exists phone_otp_expires_at;
