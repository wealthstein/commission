-- Run this directly in Supabase's SQL Editor.
--
-- Supports the inline OTP step on the Interest Form for leads referred by
-- an affiliate who hasn't yet earned Trusted status (see lib/trustScore.js).
--
-- This table is a SHORT-LIVED STAGING AREA, not a permanent record - it
-- temporarily holds the form data (name, phone, email) that would
-- otherwise go straight into the leads table, until the OTP is verified.
-- The moment verification succeeds, app/api/leads/verify-otp/route.js
-- creates the real leads row (still with zero PII, same as every other
-- lead) and DELETES this row outright - not just marks it used. Leaving
-- verified rows sitting here would quietly violate the same "no PII at
-- rest" principle the rest of this schema is built around.
create table if not exists otp_verifications (
  id                uuid primary key default gen_random_uuid(),
  program_id        uuid not null references affiliate_programs(id) on delete cascade,
  enrollment_id     uuid not null references affiliate_enrollments(id),
  click_id          uuid references referral_clicks(id),
  termii_pin_id     text not null,
  phone             text not null,
  full_name         text not null,
  email             text not null,
  attempts          int not null default 0,
  created_at        timestamptz not null default now(),
  expires_at        timestamptz not null default (now() + interval '10 minutes')
);

create index if not exists idx_otp_verifications_expires on otp_verifications(expires_at);

alter table otp_verifications enable row level security;

-- No public policies at all - every read/write to this table happens
-- through the admin/service-role client in the two API routes
-- (capture and verify-otp), never directly from the browser.
