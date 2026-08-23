-- Run this directly in Supabase's SQL Editor.
--
-- Invisible, passive lead-qualification signals - no OTP, no customer
-- action, works identically whether a business uses Commission's hosted
-- page or their own site via the custom integration (same tracking
-- script, same code path either way).
--
-- Two pieces, deliberately separated to respect the leads table's own
-- "no PII" principle (see its comment in schema.sql):
--
-- 1. leads.risk_flags - purely categorical labels ("fast_fill",
--    "cross_campaign_match", etc.) with zero identifying information.
--    Safe to store on the leads table itself, same as status already is.
--
-- 2. lead_risk_signals - a SEPARATE table, needed only for cross-campaign
--    pattern detection, which fundamentally requires comparing identifying
--    data ACROSS separate submissions - something a purely categorical
--    flag can't do alone. Stores SHA-256 HASHES of phone/IP, never the raw
--    values - a hash can be compared for an exact match without being
--    reversible back to the original phone number or IP. Retained 90 days
--    (fraud patterns need to be detected across time, unlike the
--    minutes-long retention on otp_verifications/external_lead_pending),
--    then safe to purge.
create table if not exists lead_risk_signals (
  id                    uuid primary key default gen_random_uuid(),
  lead_id               uuid not null references leads(id) on delete cascade,
  phone_hash            text not null,
  ip_hash               text,
  page_loaded_at        timestamptz,
  first_interaction_at  timestamptz,
  submitted_at          timestamptz not null default now(),
  created_at            timestamptz not null default now()
);

create index if not exists idx_lead_risk_signals_phone_hash on lead_risk_signals(phone_hash);
create index if not exists idx_lead_risk_signals_ip_hash on lead_risk_signals(ip_hash);
create index if not exists idx_lead_risk_signals_created_at on lead_risk_signals(created_at);

alter table lead_risk_signals enable row level security;
-- No public policies - every read/write happens through the admin/
-- service-role client in the lead capture routes only.

alter table leads add column if not exists risk_flags text[] not null default '{}';

-- The OTP-deferred capture path (see app/api/leads/capture) doesn't create
-- a lead row until the code is verified, so the timing data needs to be
-- staged here in the meantime, then carried over when verify-otp actually
-- creates the lead and writes the real lead_risk_signals row.
alter table otp_verifications add column if not exists page_loaded_at timestamptz;
alter table otp_verifications add column if not exists first_interaction_at timestamptz;
alter table otp_verifications add column if not exists submitter_ip text;
