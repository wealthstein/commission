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
  -- Payout destination for affiliate commissions (Paystack transfer recipient)
  bank_code               text,
  bank_account_number     text,
  bank_account_name       text,
  paystack_recipient_code text,
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
  paystack_subaccount_code text,                        -- for settlement split (DIGITAL products only)
  -- PHYSICAL products only: since Commission never holds the sale proceeds,
  -- someone still has to actually pay the affiliate their commission once a
  -- sale is verified. 'business_pays_directly' = the business pays affiliates
  -- themselves (Commission just shows them what's owed). 'commission_facilitates'
  -- = the business remits affiliate payouts to Commission's balance for
  -- Commission to disburse via the normal Paystack transfer flow.
  physical_payout_mode text not null default 'business_pays_directly'
                          check (physical_payout_mode in ('business_pays_directly','commission_facilitates')),
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
  category          text,                                -- see lib/categories.js for the physical/digital taxonomy
  -- PHYSICAL: customer pays the business directly (off-platform or their own
  --   checkout); Commission never touches the money. Revenue to Commission
  --   is subscription-only — no platform fee is ever taken (see lib/pricingPlans.js).
  -- DIGITAL: customer pays via Paystack THROUGH Commission; Commission auto-splits
  --   funds, retains its plan-based platform fee, and pays affiliates automatically.
  product_type      text not null default 'digital' check (product_type in ('physical','digital')),
  price_naira       numeric(14,2) not null check (price_naira >= 0),
  billing_frequency text not null default 'one_time'
                      check (billing_frequency in ('one_time','monthly','quarterly','annual')),
  image_url         text,
  product_url       text not null,                        -- where the customer completes purchase (Commission-hosted checkout for digital; the business's own site/WhatsApp/store for physical)
  -- PHYSICAL ONLY: how a customer pays the business directly, and/or how a
  -- sale gets verified (e.g. bank details, invoice requirement, POS reference).
  -- Shown on the product's public page and used by the business to confirm
  -- manually-reported sales (see transactions.source below).
  offline_payment_instructions text,
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
  platform_fee_percent  numeric(5,2) not null default 15,   -- fallback only; the BUSINESS'S PLAN (free=20%/pro=15%/plus=10%) is authoritative at charge time — see lib/pricingPlans.js
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
  paystack_reference     text unique,                        -- null for manually-reported PHYSICAL sales (no Paystack charge exists)
  amount_naira          numeric(14,2) not null check (amount_naira >= 0),
  status                text not null default 'pending'
                          check (status in ('pending','success','failed','refunded')),
  is_recurring_cycle    boolean not null default false,
  -- DIGITAL sales arrive automatically via the Paystack webhook ('paystack').
  -- PHYSICAL sales have no webhook at all — the business logs the sale
  -- themselves after being paid directly by the customer ('manual').
  source                text not null default 'paystack' check (source in ('paystack','manual')),
  -- Manual (physical) sales start 'pending' until the business confirms the
  -- sale actually happened ("Business confirms sale" in the physical-product
  -- flow) — only then does the commission engine run. Paystack-sourced sales
  -- don't use this column (verification is the webhook's signature check).
  verification_status   text check (verification_status in ('pending','verified','rejected')),
  proof_url             text,                                -- receipt/invoice/screenshot for a manually-reported sale
  reported_by           uuid references users(id),           -- which business user logged this manual sale
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
                          check (payout_status in ('pending','initiated','paid','failed','reversed','business_handles')),
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
-- SEO KEYWORD TARGETS  (the /[x]-affiliate-program and /[y]-affiliate-programs
-- pages). Deliberately a SEEDED, curated table rather than accepting any
-- arbitrary slug — auto-generating a page for every string anyone types is
-- exactly the "doorway page" / scaled-content-abuse pattern search engines
-- penalize, and for a real company name it would mean asserting something
-- ("X has an affiliate program") Commission can't actually verify.
-- ============================================================================
create table if not exists seo_keyword_targets (
  id                  uuid primary key default gen_random_uuid(),
  route_slug          text unique not null,   -- e.g. 'gtbank-affiliate-program' or 'fintech-affiliate-programs'
  type                text not null check (type in ('company','industry')),
  keyword_slug        text not null,          -- bare keyword: 'gtbank' or 'fintech'
  display_name        text not null,          -- 'GTBank' or 'Fintech'
  -- For a COMPANY entry: which lib/categories.js-style industry bucket it
  -- plausibly belongs to, so the placeholder page can cross-link to real
  -- live products in that space. For an INDUSTRY entry, this can just repeat
  -- display_name — it's used to query products.category for "real programs
  -- in this space" regardless of entry type.
  industry_category   text,
  -- Once a real business matching this identity actually joins Commission,
  -- set this and the page 301-redirects to /businesses/[slug] instead of
  -- showing the placeholder — this is the ONE mechanism that turns a
  -- speculative keyword page into a real, accurate one.
  claimed_business_slug text references businesses(slug),
  meta_description    text,
  created_at          timestamptz not null default now()
);

create index if not exists idx_seo_targets_type on seo_keyword_targets(type);
create index if not exists idx_seo_targets_claimed on seo_keyword_targets(claimed_business_slug);

-- "Notify me" capture on placeholder pages — the conversion mechanism for
-- visitors who land on a company/industry page that isn't live yet.
create table if not exists notify_requests (
  id              uuid primary key default gen_random_uuid(),
  seo_target_id   uuid not null references seo_keyword_targets(id) on delete cascade,
  email           text not null,
  created_at      timestamptz not null default now(),
  unique (seo_target_id, email)
);

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

alter table seo_keyword_targets enable row level security;
create policy seo_targets_public_read on seo_keyword_targets for select using (true);

alter table notify_requests enable row level security;
create policy notify_requests_public_insert on notify_requests for insert with check (true);
-- Deliberately no select policy — this is a write-only capture; reads happen
-- server-side via the service-role key.
