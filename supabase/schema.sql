-- ============================================================================
-- Commission (commission.ng) — Core Schema
-- Postgres / Supabase
--
-- Design principles reflected here (see TRD):
--   1. Single unified `users` table — every account can act as a business,
--      an affiliate, or both. No separate account types.
--   2. Affiliate programs support up to 3 tiers, enforced by CHECK + trigger.
--   3. Commission is calculated on the AFFILIATE COMMISSION, not the sale.
--   4. Commission does not hold customer funds — Paystack is source of truth
--      for money movement; this schema stores ledger records + statuses.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- USERS  (unified — every account is a Commission user)
-- ----------------------------------------------------------------------------
create table if not exists users (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid unique not null,               -- maps to supabase auth.users.id
  email           text unique not null,
  full_name       text,
  avatar_url      text,
  phone           text,
  -- Referral: who brought THIS user onto the platform (drives user-referral payouts, sec. "pay users for referring other users")
  referred_by     uuid references users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_users_referred_by on users(referred_by);

-- ----------------------------------------------------------------------------
-- BUSINESSES  (a user's business profile — a user may own zero or more)
-- ----------------------------------------------------------------------------
create table if not exists businesses (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references users(id) on delete cascade,
  name            text not null,
  slug            text unique not null,
  description     text,
  logo_url        text,
  website_url     text,
  industry        text,                                -- e.g. HMO, HR Software, SaaS, Insurance, ISP
  plan            text not null default 'free' check (plan in ('free','pro','plus')),
  plan_renews_at  timestamptz,
  paystack_subaccount_code text,                        -- for settlement split
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_businesses_owner on businesses(owner_id);

-- ----------------------------------------------------------------------------
-- PRODUCTS
-- ----------------------------------------------------------------------------
create table if not exists products (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  name              text not null,
  slug              text not null,
  description       text,
  category          text,                                -- HMO, HR Software, SaaS, Insurance, ISP, Other
  product_type      text not null default 'service' check (product_type in ('product','service')),
  price_naira       numeric(14,2) not null check (price_naira >= 0),
  billing_frequency text not null default 'one_time'
                      check (billing_frequency in ('one_time','monthly','quarterly','annual')),
  image_url         text,
  product_url       text not null,                        -- where the customer completes purchase
  status            text not null default 'draft' check (status in ('draft','active','paused','archived')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (business_id, slug)
);

create index if not exists idx_products_business on products(business_id);
create index if not exists idx_products_status on products(status);

-- ----------------------------------------------------------------------------
-- AFFILIATE PROGRAMS  (one active program per product, up to 3 tiers)
-- ----------------------------------------------------------------------------
create table if not exists affiliate_programs (
  id                    uuid primary key default gen_random_uuid(),
  product_id            uuid not null references products(id) on delete cascade,
  commission_type       text not null check (commission_type in ('one_time','recurring')),
  tier1_percent         numeric(5,2) not null check (tier1_percent >= 0),
  tier2_percent         numeric(5,2) not null default 0 check (tier2_percent >= 0),
  tier3_percent         numeric(5,2) not null default 0 check (tier3_percent >= 0),
  platform_fee_percent  numeric(5,2) not null default 15,   -- % of the AFFILIATE COMMISSION Commission retains
  attribution_days      integer not null default 30,        -- referral cookie/attribution window
  min_payout_naira      numeric(14,2) default 0,
  requires_approval     boolean not null default false,
  terms                 text,
  status                text not null default 'active' check (status in ('draft','active','paused','ended')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  -- Enforce max 3-tier structure and total <= 100%
  constraint chk_total_commission check (tier1_percent + tier2_percent + tier3_percent <= 100)
);

create unique index if not exists idx_one_active_program_per_product
  on affiliate_programs(product_id) where status = 'active';

-- Marketing assets attached to a program (banners, copy, links)
create table if not exists marketing_assets (
  id            uuid primary key default gen_random_uuid(),
  program_id    uuid not null references affiliate_programs(id) on delete cascade,
  type          text not null check (type in ('image','copy','video','link')),
  url           text,
  content       text,
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- AFFILIATE ENROLLMENTS  (a user joining a specific product's program)
-- Tier position within THIS program is derived from which affiliate referred
-- them into the program (self-referential — see referrer_enrollment_id).
-- ----------------------------------------------------------------------------
create table if not exists affiliate_enrollments (
  id                    uuid primary key default gen_random_uuid(),
  program_id            uuid not null references affiliate_programs(id) on delete cascade,
  affiliate_id          uuid not null references users(id) on delete cascade,
  -- The enrollment of whoever recruited this affiliate into THIS program (null = direct/organic join = tier 1)
  referrer_enrollment_id uuid references affiliate_enrollments(id),
  tier                  smallint not null default 1 check (tier between 1 and 3),
  referral_code         text unique not null,               -- e.g. "ABC123" -> commission.ng/r/ABC123
  status                text not null default 'active' check (status in ('pending','active','suspended')),
  created_at            timestamptz not null default now(),
  unique (program_id, affiliate_id)
);

create index if not exists idx_enrollments_program on affiliate_enrollments(program_id);
create index if not exists idx_enrollments_affiliate on affiliate_enrollments(affiliate_id);
create index if not exists idx_enrollments_referrer on affiliate_enrollments(referrer_enrollment_id);

-- Trigger: derive tier from referrer chain and enforce max depth of 3.
create or replace function fn_set_enrollment_tier()
returns trigger as $$
declare
  parent_tier smallint;
begin
  if new.referrer_enrollment_id is null then
    new.tier := 1;
  else
    select tier into parent_tier from affiliate_enrollments where id = new.referrer_enrollment_id;
    if parent_tier is null then
      raise exception 'referrer_enrollment_id % not found', new.referrer_enrollment_id;
    end if;
    if parent_tier >= 3 then
      raise exception 'Maximum 3-tier affiliate depth exceeded';
    end if;
    new.tier := parent_tier + 1;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_enrollment_tier on affiliate_enrollments;
create trigger trg_set_enrollment_tier
  before insert on affiliate_enrollments
  for each row execute function fn_set_enrollment_tier();

-- ----------------------------------------------------------------------------
-- REFERRAL CLICKS  (top-of-funnel tracking before a purchase happens)
-- ----------------------------------------------------------------------------
create table if not exists referral_clicks (
  id              uuid primary key default gen_random_uuid(),
  enrollment_id   uuid not null references affiliate_enrollments(id) on delete cascade,
  visitor_id      text not null,          -- anonymous cookie/device id
  ip_hash         text,
  user_agent      text,
  landed_at       timestamptz not null default now(),
  expires_at      timestamptz not null    -- landed_at + program.attribution_days
);

create index if not exists idx_clicks_enrollment on referral_clicks(enrollment_id);
create index if not exists idx_clicks_visitor on referral_clicks(visitor_id);

-- ----------------------------------------------------------------------------
-- CUSTOMERS  (the person who buys — may or may not be a platform user)
-- ----------------------------------------------------------------------------
create table if not exists customers (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  email           text not null,
  paystack_customer_code text,
  attributed_enrollment_id uuid references affiliate_enrollments(id),  -- last-touch attribution
  created_at      timestamptz not null default now(),
  unique (business_id, email)
);

-- ----------------------------------------------------------------------------
-- TRANSACTIONS  (a Paystack charge — one-time sale or a recurring cycle)
-- ----------------------------------------------------------------------------
create table if not exists transactions (
  id                    uuid primary key default gen_random_uuid(),
  product_id            uuid not null references products(id),
  customer_id           uuid not null references customers(id),
  enrollment_id         uuid references affiliate_enrollments(id),  -- referring (tier-1) affiliate for this sale
  paystack_reference     text unique not null,
  amount_naira          numeric(14,2) not null check (amount_naira >= 0),
  status                text not null default 'pending'
                          check (status in ('pending','success','failed','refunded')),
  is_recurring_cycle    boolean not null default false,
  occurred_at           timestamptz not null default now(),
  created_at            timestamptz not null default now()
);

create index if not exists idx_transactions_product on transactions(product_id);
create index if not exists idx_transactions_enrollment on transactions(enrollment_id);
create unique index if not exists idx_transactions_reference on transactions(paystack_reference);

-- ----------------------------------------------------------------------------
-- COMMISSIONS  (ledger — one row PER TIER PER TRANSACTION)
-- ----------------------------------------------------------------------------
create table if not exists commissions (
  id                    uuid primary key default gen_random_uuid(),
  transaction_id        uuid not null references transactions(id) on delete cascade,
  enrollment_id         uuid not null references affiliate_enrollments(id),
  tier                  smallint not null check (tier between 1 and 3),
  commission_percent    numeric(5,2) not null,
  commission_amount_naira numeric(14,2) not null,
  platform_fee_percent  numeric(5,2) not null,
  platform_fee_naira    numeric(14,2) not null,
  affiliate_payout_naira numeric(14,2) not null,   -- commission_amount - platform_fee
  payout_status         text not null default 'pending'
                          check (payout_status in ('pending','initiated','paid','failed','reversed')),
  paystack_transfer_code text,
  created_at            timestamptz not null default now(),
  unique (transaction_id, tier)
);

create index if not exists idx_commissions_enrollment on commissions(enrollment_id);
create index if not exists idx_commissions_transaction on commissions(transaction_id);
create index if not exists idx_commissions_payout_status on commissions(payout_status);

-- ----------------------------------------------------------------------------
-- PAYOUTS  (batched transfer to an affiliate's bank account via Paystack)
-- ----------------------------------------------------------------------------
create table if not exists payouts (
  id              uuid primary key default gen_random_uuid(),
  affiliate_id    uuid not null references users(id),
  amount_naira    numeric(14,2) not null check (amount_naira > 0),
  status          text not null default 'pending'
                    check (status in ('pending','initiated','paid','failed')),
  paystack_transfer_code text,
  paystack_recipient_code text,
  initiated_at    timestamptz,
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- Join table: which commission ledger rows a payout covers
create table if not exists payout_commissions (
  payout_id       uuid not null references payouts(id) on delete cascade,
  commission_id   uuid not null references commissions(id) on delete cascade,
  primary key (payout_id, commission_id)
);

-- ----------------------------------------------------------------------------
-- USER REFERRAL PAYOUTS  ("pay users for referring other users into their
-- affiliate program" — distinct from product-sale commissions above)
-- ----------------------------------------------------------------------------
create table if not exists user_referral_rewards (
  id                uuid primary key default gen_random_uuid(),
  referrer_id       uuid not null references users(id),
  referred_user_id  uuid not null references users(id) unique,
  reward_naira      numeric(14,2) not null default 0,
  status            text not null default 'pending' check (status in ('pending','paid')),
  created_at        timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function fn_touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_users on users;
create trigger trg_touch_users before update on users
  for each row execute function fn_touch_updated_at();

drop trigger if exists trg_touch_businesses on businesses;
create trigger trg_touch_businesses before update on businesses
  for each row execute function fn_touch_updated_at();

drop trigger if exists trg_touch_products on products;
create trigger trg_touch_products before update on products
  for each row execute function fn_touch_updated_at();

drop trigger if exists trg_touch_programs on affiliate_programs;
create trigger trg_touch_programs before update on affiliate_programs
  for each row execute function fn_touch_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (starter policies — refine per launch)
-- ============================================================================
alter table users enable row level security;
alter table businesses enable row level security;
alter table products enable row level security;
alter table affiliate_programs enable row level security;
alter table affiliate_enrollments enable row level security;
alter table transactions enable row level security;
alter table commissions enable row level security;
alter table payouts enable row level security;

-- Users can read/update their own row
create policy users_self_select on users for select using (auth.uid() = auth_user_id);
create policy users_self_update on users for update using (auth.uid() = auth_user_id);

-- Businesses: owners manage their own; anyone can read active listings via products join (handled in app layer)
create policy businesses_owner_all on businesses for all
  using (owner_id in (select id from users where auth_user_id = auth.uid()));

-- Products: publicly readable when active, owner can manage
create policy products_public_read on products for select using (status = 'active');
create policy products_owner_manage on products for all
  using (business_id in (
    select id from businesses where owner_id in (select id from users where auth_user_id = auth.uid())
  ));

-- Affiliate enrollments: an affiliate can see their own; program owner can see all enrollments in their program
create policy enrollments_self_select on affiliate_enrollments for select
  using (affiliate_id in (select id from users where auth_user_id = auth.uid()));

-- Commissions: affiliate can see their own earned commissions
create policy commissions_self_select on commissions for select
  using (enrollment_id in (
    select id from affiliate_enrollments where affiliate_id in (
      select id from users where auth_user_id = auth.uid()
    )
  ));

-- Payouts: affiliate can see their own payouts
create policy payouts_self_select on payouts for select
  using (affiliate_id in (select id from users where auth_user_id = auth.uid()));

-- NOTE: All writes to transactions/commissions/payouts happen server-side via
-- the service-role key (Paystack webhook handler), bypassing RLS by design.
