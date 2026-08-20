-- Run this directly in Supabase's SQL Editor.
--
-- Bridges Paystack's subscription renewal charges back to the correct
-- product/affiliate attribution. Paystack does NOT carry forward the
-- custom metadata (product_id, referral_code) we attach at checkout onto
-- renewal charge.success events - confirmed against Paystack's own
-- documented sample payload, which shows metadata as empty on renewals.
-- Renewals only carry customer.customer_code and plan (the plan code),
-- so this table is keyed on that pairing instead.

create table if not exists subscription_attribution (
  id             uuid primary key default gen_random_uuid(),
  customer_code  text not null,
  plan_code      text not null,
  product_id     uuid not null references products(id) on delete cascade,
  enrollment_id  uuid references affiliate_enrollments(id),
  business_id    uuid not null references businesses(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (customer_code, plan_code)
);

create index if not exists idx_subscription_attribution_lookup on subscription_attribution(customer_code, plan_code);

alter table subscription_attribution enable row level security;

-- No public policies - every read/write happens through the admin/
-- service-role client in the Paystack webhook handler only.
