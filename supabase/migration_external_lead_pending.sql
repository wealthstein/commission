-- Run this directly in Supabase's SQL Editor.
--
-- Bridges the gap between external-capture (business's own site) and the
-- embedded qualification widget. Same justified exception as
-- otp_verifications: this is a short-lived STAGING table, not a
-- permanent PII store. The leads table itself never sees this data - it
-- exists only for the window between capture and qualification, and gets
-- deleted outright the moment qualification succeeds or the row expires.
--
-- Why this is needed at all: external-capture never stored the customer's
-- phone/email/metadata anywhere (consistent with "no PII on the leads
-- row"), but the qualification widget needs that phone number later to
-- send the confirmation OTP to - without asking the customer to type it
-- in a second time.
create table if not exists external_lead_pending (
  lead_id       uuid primary key references leads(id) on delete cascade,
  full_name     text not null,
  phone         text not null,
  email         text not null,
  metadata      jsonb,
  termii_pin_id text,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '72 hours')
);

create index if not exists idx_external_lead_pending_expires on external_lead_pending(expires_at);

alter table external_lead_pending enable row level security;

-- No public policies - every read/write happens through the admin/
-- service-role client in the capture and embed-widget API routes only.
