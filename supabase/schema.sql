-- ============================================================================
-- ⚠️  DANGER ZONE — DROPS EVERY TABLE AND ALL DATA IN IT ⚠️
-- ------------------------------------------------------------------------
-- This block exists so the whole file can be run repeatedly during active
-- development without hitting "already exists" errors. It is DESTRUCTIVE —
-- every row in every Commission table is gone the moment this runs.
--
-- DO NOT run this against a database with real user/business/transaction
-- data. If you ever need to change the schema on a live database instead,
-- delete this block and write a proper ALTER TABLE migration instead.
-- ============================================================================
drop table if exists payout_commissions cascade;
drop table if exists payouts cascade;
drop table if exists wallet_transactions cascade;
drop table if exists commissions cascade;
drop table if exists leads cascade;
drop table if exists transactions cascade;
drop table if exists customers cascade;
drop table if exists referral_clicks cascade;
drop table if exists affiliate_enrollments cascade;
drop table if exists marketing_assets cascade;
drop table if exists affiliate_programs cascade;
drop table if exists products cascade;
-- (waitlist_requests table removed — see the note further down where it used to be defined)
drop table if exists user_referral_rewards cascade;
drop table if exists businesses cascade;
drop table if exists business_team_members cascade;
drop table if exists campaign_custom_fields cascade;
drop table if exists users cascade;
drop function if exists fn_charge_wallet(uuid, numeric, text, uuid, uuid, text) cascade;
drop function if exists fn_charge_wallet(uuid, numeric, text, uuid, uuid, text, numeric, numeric) cascade;

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
  -- Set true only once this person has been manually granted real dashboard
  -- access. Signing in with Google always creates/authenticates the auth
  -- user - but until this is true, app/api/auth/callback sends them to
  -- /welcome instead of /dashboard regardless of what was requested.
  -- This is what lets Google auth double as a (higher-quality, verified)
  -- way to register interest before the dashboard is generally open.
  access_granted boolean not null default false,
  -- Captured from whichever CTA triggered Google auth (business or
  -- affiliate) - there is no manual form anymore, so this is the only
  -- signal of which side someone was interested in. Informational for now,
  -- not yet used to branch any copy.
  intended_role      text check (intended_role in ('business','affiliate')),
  -- Which page they were on when they clicked through to Google auth.
  signup_source_page text,
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
  whatsapp_number text,                                 -- default WhatsApp number for lead follow-up; can be overridden per-campaign on affiliate_programs
  industry        text,                                -- e.g. HMO, HR Software, SaaS, Insurance, ISP
  plan            text not null default 'free' check (plan in ('free','pro','plus')),
  plan_renews_at  timestamptz,
  -- CAMPAIGN WALLET — used by LEAD-goal campaigns only. Customers never pay
  -- Commission directly for a lead (there is no live payment event); instead
  -- the business pre-funds this wallet via Paystack, and Commission deducts
  -- from it the moment a lead is qualified — see fn_charge_wallet() below.
  -- SALE-goal campaigns do NOT use this — see paystack_subaccount_code below
  -- instead, where the customer's payment is split automatically at
  -- checkout by Paystack itself.
  wallet_balance_naira numeric(14,2) not null default 0 check (wallet_balance_naira >= 0),
  -- SALE-goal campaigns only. The customer pays Commission directly at
  -- checkout (see lib/checkout.js), and Paystack splits that single payment
  -- automatically: the affiliate commission total stays with Commission's
  -- main account (to later pay out affiliates + keep the platform fee),
  -- and the rest is routed straight to this subaccount — the business's own
  -- proceeds, same transaction, no manual transfer needed afterward. Set via
  -- app/api/paystack/subaccount.
  paystack_subaccount_code text,
  -- Where a qualified lead's full details (name/phone/email/answers) get
  -- forwarded to, since Commission never stores them (see the leads table).
  -- If neither is set, forwarding falls back to the business owner's own
  -- account email.
  lead_notification_email text,
  lead_webhook_url        text,
  -- Landing-page branding for the two Commission-hosted campaign pages
  -- (Short Form + Long Form). Which of these actually get applied is
  -- gated by plan tier — see lib/branding.js. Small = Commission's own
  -- look only, Medium = logo, Large = logo + brand color.
  landing_logo_url      text,
  landing_primary_color text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_businesses_owner on businesses(owner_id);

-- ----------------------------------------------------------------------------
-- BUSINESS TEAM MEMBERS — Medium/Large plan feature (see lib/siteSections.js
-- "team-management"). A business owner invites a teammate by email; the row
-- starts 'invited' with user_id null, and becomes 'active' with user_id set
-- once that person signs in with Google and accepts (see
-- app/api/team/accept/route.js). Distinct from businesses.owner_id, which
-- always stays the original creator and can never be removed here.
-- ----------------------------------------------------------------------------
create table if not exists business_team_members (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  -- Null until the invite is accepted - see status below.
  user_id       uuid references users(id) on delete cascade,
  email         text not null,
  -- admin: everything owner can do except remove the owner or delete the
  -- business. member: view/manage campaigns and leads, no billing or team access.
  role          text not null default 'member' check (role in ('admin', 'member')),
  status        text not null default 'invited' check (status in ('invited', 'active', 'revoked')),
  invited_by    uuid not null references users(id),
  invite_token  uuid not null default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (business_id, email)
);

create index if not exists idx_team_members_business on business_team_members(business_id);
create index if not exists idx_team_members_user on business_team_members(user_id);

alter table business_team_members enable row level security;

drop policy if exists team_members_select on business_team_members;
create policy team_members_select on business_team_members for select
  using (
    business_id in (
      select id from businesses where owner_id in (select id from users where auth_user_id = auth.uid())
      union
      select business_id from business_team_members
      where user_id in (select id from users where auth_user_id = auth.uid()) and status = 'active'
    )
  );

-- Only the business owner or an active admin teammate can invite/edit/remove
-- team members - a plain member cannot manage the team even though they can
-- see who else is on it (the select policy above).
drop policy if exists team_members_manage on business_team_members;
create policy team_members_manage on business_team_members for all
  using (
    business_id in (
      select id from businesses where owner_id in (select id from users where auth_user_id = auth.uid())
      union
      select business_id from business_team_members
      where user_id in (select id from users where auth_user_id = auth.uid()) and status = 'active' and role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- PRODUCTS
-- ----------------------------------------------------------------------------
create table if not exists products (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  name              text not null,
  slug              text not null,
  description       text,
  category          text,                                -- see lib/categories.js
  -- Physical vs digital is now purely a CATEGORY distinction (electronics vs
  -- SaaS) — it no longer determines payment flow. Every product's customer
  -- pays the business directly (product_url), regardless of type. What
  -- actually determines Commission's monetization mechanism is
  -- affiliate_programs.conversion_goal (sale vs lead) — see below.
  product_type      text not null default 'digital' check (product_type in ('physical','digital')),
  price_naira       numeric(14,2) not null check (price_naira >= 0),
  billing_frequency text not null default 'one_time'
                      check (billing_frequency in ('one_time','monthly','quarterly','annual')),
  image_url         text,
  product_url       text not null,                        -- where the customer completes purchase — ALWAYS the business's own site/WhatsApp/store; Commission is never the merchant of record
  -- How a customer pays the business directly, and/or how a sale gets
  -- verified for 'sale'-goal campaigns (e.g. bank details, invoice
  -- requirement). Shown on the product's public Campaign Page.
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
  -- What Commission actually gets paid to track and charge for. The two
  -- goals work completely differently:
  --   'sale' -> the customer pays COMMISSION directly at a Commission-hosted
  --     checkout (see lib/checkout.js, app/r/[code]). Paystack splits that
  --     single payment automatically: the affiliate commission total stays
  --     with Commission's main account (to pay out affiliates + keep the
  --     platform fee), the rest is routed straight to the business's own
  --     Paystack subaccount (businesses.paystack_subaccount_code) — no
  --     wallet involved at all.
  --   'lead' -> the customer never pays Commission anything; the business
  --     pre-funds a WALLET instead (see fn_charge_wallet() below), and the
  --     funnel (Campaign Page -> Short Form -> unique WhatsApp link -> Long
  --     Form -> Qualified) is what charges it. See the `leads` table below.
  conversion_goal       text not null default 'lead' check (conversion_goal in ('sale','lead')),
  -- Required when conversion_goal = 'lead'. What the business is willing to
  -- pay for ONE qualified lead — e.g. ₦5,000. The commission engine treats
  -- this flat amount exactly like a sale amount (same tiers, same
  -- plan-based platform fee math), and it's what gets deducted from the
  -- wallet the moment a lead is marked qualified.
  cost_per_qualified_lead_naira numeric(14,2),
  -- Where the unique per-lead WhatsApp link points once someone submits the
  -- Short Form. Falls back to businesses.whatsapp_number if not set here
  -- (a business might route different campaigns to different sales teams).
  whatsapp_number       text,
  -- OPTIONAL advanced integration: a business with their own CRM can POST to
  -- app/api/leads/[id]/qualify directly with this token instead of a human
  -- filling out Commission's hosted Long Form page. Either path ends at the
  -- same place — lead marked qualified, wallet charged.
  postback_token        text default encode(gen_random_bytes(16), 'hex'),
  tier1_percent         numeric(5,2) not null check (tier1_percent >= 0),
  tier2_percent         numeric(5,2) not null default 0 check (tier2_percent >= 0),
  tier3_percent         numeric(5,2) not null default 0 check (tier3_percent >= 0),
  platform_fee_percent  numeric(5,2) not null default 15,   -- fallback only; the BUSINESS'S PLAN (small=20%/medium=15%/large=10%) is authoritative at charge time — see lib/pricingPlans.js
  attribution_days      integer not null default 30,        -- referral cookie/attribution window
  min_payout_naira      numeric(14,2) default 0,
  requires_approval     boolean not null default false,
  terms                 text,
  status                text not null default 'active' check (status in ('draft','active','paused','ended')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  -- Enforce max 3-tier structure. For a LEAD campaign these should sum to
  -- exactly 100 (the whole lead fee is allocated across tiers, then the
  -- platform fee is skimmed from each tier's share). For a SALE campaign
  -- they represent each tier's cut of the sale, same as before.
  constraint chk_total_commission check (tier1_percent + tier2_percent + tier3_percent <= 100),
  constraint chk_lead_cost_required check (conversion_goal <> 'lead' or cost_per_qualified_lead_naira is not null),
  -- Direct-sale campaigns must commit at least 10% of the sale to affiliates
  -- in total across tiers — a floor so a business cannot list a sale
  -- campaign with a token commission that is not worth an affiliate's time.
  constraint chk_min_sale_commission check (
    conversion_goal <> 'sale' or (tier1_percent + tier2_percent + tier3_percent) >= 10
  )
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
-- LEADS  (the trackable conversion event for a 'lead'-goal campaign)
-- ----------------------------------------------------------------------------
-- The funnel this table models:
--   Visitor -> Campaign Page -> Short Form -> Lead (status='captured')
--     -> unique WhatsApp link (whatsapp_ref embedded in the wa.me URL)
--     -> business chats with them, sends the Long Form when ready to qualify
--     -> Long Form submitted -> Lead (status='qualified')  <- BILLABLE MOMENT
-- Qualifying a lead is what charges the business's wallet and runs the
-- commission engine (see app/api/leads/[id]/qualify) — nothing is owed for
-- a merely-captured lead, only a qualified one.
-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- CAMPAIGN CUSTOM FIELDS — Medium/Large plan feature (see
-- lib/siteSections.js "custom-fields"). A business designs its own Long
-- Form questions per campaign (e.g. "What's your budget?", "How soon are
-- you looking to start?"). This table stores only the QUESTION
-- DEFINITIONS a business writes - never a prospect's ANSWERS. Answers get
-- the exact same treatment as name/phone/email: forwarded to the business
-- (see lib/leadForwarding.js) and discarded, never written to Commission's
-- own database. This keeps the no-PII-storage principle intact even though
-- a business could technically write a sensitive question here themselves
-- - the answer still never lands in Commission's database either way.
-- ----------------------------------------------------------------------------
create table if not exists campaign_custom_fields (
  id                    uuid primary key default gen_random_uuid(),
  affiliate_program_id  uuid not null references affiliate_programs(id) on delete cascade,
  label                 text not null,
  field_type            text not null default 'text' check (field_type in ('text', 'select')),
  -- Only used when field_type = 'select' - a JSON array of option strings.
  options               jsonb,
  required              boolean not null default false,
  display_order         int not null default 0,
  created_at            timestamptz not null default now()
);

create index if not exists idx_custom_fields_program on campaign_custom_fields(affiliate_program_id);

alter table campaign_custom_fields enable row level security;

drop policy if exists custom_fields_select on campaign_custom_fields;
create policy custom_fields_select on campaign_custom_fields for select
  using (true); -- public - the Long Form page needs to read these for an anonymous prospect

drop policy if exists custom_fields_manage on campaign_custom_fields;
create policy custom_fields_manage on campaign_custom_fields for all
  using (
    affiliate_program_id in (
      select ap.id from affiliate_programs ap
      join products p on p.id = ap.product_id
      join businesses b on b.id = p.business_id
      where b.owner_id in (select id from users where auth_user_id = auth.uid())
      union
      select ap.id from affiliate_programs ap
      join products p on p.id = ap.product_id
      where p.business_id in (
        select business_id from business_team_members
        where user_id in (select id from users where auth_user_id = auth.uid()) and status = 'active'
      )
    )
  );

create table if not exists leads (
  id                uuid primary key default gen_random_uuid(),
  program_id        uuid not null references affiliate_programs(id) on delete cascade,
  click_id          uuid references referral_clicks(id),     -- which referral click this lead traces back to
  enrollment_id     uuid not null references affiliate_enrollments(id),
  -- Unique code embedded in the WhatsApp deep link (wa.me/...?text=...REF...)
  -- so the business can tell which WhatsApp conversation belongs to which
  -- lead, and so the public Long Form page (app/leads/[whatsappRef]/continue)
  -- can find the right row without exposing the raw database id.
  whatsapp_ref      text unique not null,
  -- ------------------------------------------------------------------------
  -- DELIBERATELY NO PII HERE. Commission owns the affiliates; each business
  -- owns their leads. Name/phone/email/qualification answers are NEVER
  -- written to this table — they are forwarded straight to the business
  -- (their email or their own webhook/CRM, see lib/leadForwarding.js) and
  -- then discarded from server memory. This row only tracks the ATTRIBUTION
  -- and BILLING event, not the lead's identity.
  -- ------------------------------------------------------------------------
  forwarded_to      text check (forwarded_to in ('email','webhook','both','none')),
  status            text not null default 'captured' check (status in ('captured','qualified','rejected')),
  -- Snapshot of affiliate_programs.cost_per_qualified_lead_naira at the
  -- moment of qualification — so a later change to the program's pricing
  -- never retroactively changes what an already-qualified lead cost.
  charge_amount_naira numeric(14,2),
  qualified_at      timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists idx_leads_program on leads(program_id);
create index if not exists idx_leads_enrollment on leads(enrollment_id);
create index if not exists idx_leads_click on leads(click_id);
create index if not exists idx_leads_whatsapp_ref on leads(whatsapp_ref);

-- ----------------------------------------------------------------------------
-- TRANSACTIONS  (a self-reported SALE, for 'sale'-goal campaigns only)
-- ----------------------------------------------------------------------------
-- Customers always pay the business directly (see products.product_url) —
-- there's no Paystack charge for Commission to hook into. The business logs
-- the sale here, confirms it happened, and that confirmation charges the
-- wallet (app/api/sales/report + app/api/sales/[id]/verify) — the same
-- mechanism a 'lead' campaign uses when a lead is qualified.
-- ----------------------------------------------------------------------------
create table if not exists transactions (
  id                    uuid primary key default gen_random_uuid(),
  product_id            uuid not null references products(id),
  customer_id           uuid not null references customers(id),
  enrollment_id         uuid references affiliate_enrollments(id),  -- referring (tier-1) affiliate for this sale
  amount_naira          numeric(14,2) not null check (amount_naira >= 0),
  status                text not null default 'pending'
                          check (status in ('pending','success','failed','refunded')),
  is_recurring_cycle    boolean not null default false,
  -- Starts 'pending' until the business confirms the sale actually happened
  -- — only then does the commission engine run and the wallet get charged.
  verification_status   text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  proof_url             text,                                -- receipt/invoice/screenshot for the reported sale
  reported_by           uuid references users(id),           -- which business user logged this sale
  occurred_at           timestamptz not null default now(),
  created_at            timestamptz not null default now()
);

create index if not exists idx_transactions_product on transactions(product_id);
create index if not exists idx_transactions_enrollment on transactions(enrollment_id);

-- ----------------------------------------------------------------------------
-- COMMISSIONS  (ledger — one row PER TIER PER TRANSACTION)
-- ----------------------------------------------------------------------------
create table if not exists commissions (
  id                    uuid primary key default gen_random_uuid(),
  -- Exactly one of these two is set — a commission is earned from either a
  -- verified SALE or a verified LEAD, never both.
  transaction_id        uuid references transactions(id) on delete cascade,
  lead_id               uuid references leads(id) on delete cascade,
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
  constraint chk_exactly_one_source check (
    (transaction_id is not null and lead_id is null) or
    (transaction_id is null and lead_id is not null)
  )
);

create unique index if not exists idx_commissions_one_per_transaction_tier
  on commissions(transaction_id, tier) where transaction_id is not null;
create unique index if not exists idx_commissions_one_per_lead_tier
  on commissions(lead_id, tier) where lead_id is not null;

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
-- WALLET TRANSACTIONS  (the ledger behind businesses.wallet_balance_naira)
-- ----------------------------------------------------------------------------
-- Every credit (a Paystack top-up) and every debit (a qualified lead or
-- verified sale) is recorded here, in addition to just updating the running
-- balance — this is the audit trail a business (and Commission) can point
-- to for "why is my balance what it is."
-- ----------------------------------------------------------------------------
create table if not exists wallet_transactions (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references businesses(id) on delete cascade,
  type                text not null check (type in ('topup','qualified_lead_charge','sale_charge','refund','adjustment')),
  -- Positive = money added to the wallet (topup, refund). Negative = money
  -- deducted (a charge). balance_after_naira is a point-in-time snapshot so
  -- a business's statement is reconstructable without replaying every row.
  amount_naira        numeric(14,2) not null,
  balance_after_naira  numeric(14,2) not null,
  -- Set on 'topup' rows only: what the business actually paid via Paystack
  -- (gross_amount_naira) versus what Commission kept as its plan-based fee
  -- (platform_fee_naira) versus what actually landed in the wallet
  -- (amount_naira above = gross - fee). This is where the fee is taken now
  -- — NOT per-lead/per-sale — so a qualified lead or verified sale deducts
  -- its full commission straight to affiliates with no further fee.
  gross_amount_naira    numeric(14,2),
  platform_fee_naira    numeric(14,2),
  related_lead_id      uuid references leads(id),
  related_transaction_id uuid references transactions(id),
  paystack_reference   text,                                -- set for 'topup' rows
  created_at           timestamptz not null default now()
);

create index if not exists idx_wallet_txns_business on wallet_transactions(business_id);
create index if not exists idx_wallet_txns_type on wallet_transactions(type);

-- Atomically credit or debit a business's wallet and log the ledger row in
-- one round trip, with row locking so two simultaneous qualifications can
-- never both succeed against a balance that only covers one of them.
-- p_amount is SIGNED and is the NET change to the wallet balance: for a
-- topup this is the gross payment MINUS the platform fee (pass p_gross and
-- p_fee too, purely for the audit trail — they do not affect the balance
-- math themselves, p_amount already has the fee baked in). Raises an
-- exception (and rolls back) if a debit would take the balance below zero.
create or replace function fn_charge_wallet(
  p_business_id uuid,
  p_amount numeric,
  p_type text,
  p_lead_id uuid default null,
  p_transaction_id uuid default null,
  p_paystack_reference text default null,
  p_gross_amount numeric default null,
  p_platform_fee numeric default null
) returns wallet_transactions as $$
declare
  v_balance numeric;
  v_txn wallet_transactions;
begin
  select wallet_balance_naira into v_balance from businesses where id = p_business_id for update;
  if v_balance is null then
    raise exception 'Business % not found', p_business_id;
  end if;
  if v_balance + p_amount < 0 then
    raise exception 'Insufficient wallet balance: have %, need %', v_balance, -p_amount;
  end if;

  update businesses set wallet_balance_naira = wallet_balance_naira + p_amount where id = p_business_id;

  insert into wallet_transactions (
    business_id, type, amount_naira, balance_after_naira,
    related_lead_id, related_transaction_id, paystack_reference,
    gross_amount_naira, platform_fee_naira
  )
  values (
    p_business_id, p_type, p_amount, v_balance + p_amount,
    p_lead_id, p_transaction_id, p_paystack_reference,
    p_gross_amount, p_platform_fee
  )
  returning * into v_txn;

  return v_txn;
end;
$$ language plpgsql;

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
-- SEO KEYWORD TARGETS and NOTIFY_REQUESTS have been REMOVED.
--
-- Programs content (the /programs/[industry] and /programs/[industry]/[company]
-- pages) moved from this table to content/programs.json — curated marketing
-- copy that ships with the codebase, same as content/industries.json,
-- content/categories.json, and content/pricingPlans.json. See lib/programs.js.
-- The one real tradeoff: claiming a program for a real business that joins
-- (claimedBusinessSlug) now requires editing content/programs.json and
-- redeploying, rather than flipping one field on a live database row.
--
-- notify_requests backed NotifyMeForm, an email-only "get notified"
-- capture that was redundant with RequestAccountForm (the real lead-magnet
-- form) and has been removed from every page — see components/marketing/
-- RequestAccountForm.js, which is the single form used everywhere now.
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
drop policy if exists users_self_select on users;
create policy users_self_select on users for select using (auth.uid() = auth_user_id);
drop policy if exists users_self_update on users;
create policy users_self_update on users for update using (auth.uid() = auth_user_id);

-- Businesses: owners manage their own; anyone can read active listings via products join (handled in app layer)
drop policy if exists businesses_owner_all on businesses;
create policy businesses_owner_all on businesses for all
  using (owner_id in (select id from users where auth_user_id = auth.uid()));

-- Products: publicly readable when active, owner can manage
drop policy if exists products_public_read on products;
create policy products_public_read on products for select using (status = 'active');
drop policy if exists products_owner_manage on products;
create policy products_owner_manage on products for all
  using (business_id in (
    select id from businesses where owner_id in (select id from users where auth_user_id = auth.uid())
  ));

-- Affiliate enrollments: an affiliate can see their own; program owner can see all enrollments in their program
drop policy if exists enrollments_self_select on affiliate_enrollments;
create policy enrollments_self_select on affiliate_enrollments for select
  using (affiliate_id in (select id from users where auth_user_id = auth.uid()));

-- Commissions: affiliate can see their own earned commissions
drop policy if exists commissions_self_select on commissions;
create policy commissions_self_select on commissions for select
  using (enrollment_id in (
    select id from affiliate_enrollments where affiliate_id in (
      select id from users where auth_user_id = auth.uid()
    )
  ));

-- Payouts: affiliate can see their own payouts
drop policy if exists payouts_self_select on payouts;
create policy payouts_self_select on payouts for select
  using (affiliate_id in (select id from users where auth_user_id = auth.uid()));

-- NOTE: All writes to transactions/commissions/payouts/leads/wallet_transactions
-- happen server-side via the service-role key (Paystack webhook, lead
-- qualification, sale verification, payout batching), bypassing RLS by design.

alter table leads enable row level security;
drop policy if exists leads_program_owner_select on leads;
create policy leads_program_owner_select on leads for select
  using (program_id in (
    select ap.id from affiliate_programs ap
    join products p on p.id = ap.product_id
    join businesses b on b.id = p.business_id
    where b.owner_id in (select id from users where auth_user_id = auth.uid())
  ));

alter table wallet_transactions enable row level security;
drop policy if exists wallet_txns_owner_select on wallet_transactions;
create policy wallet_txns_owner_select on wallet_transactions for select
  using (business_id in (
    select id from businesses where owner_id in (select id from users where auth_user_id = auth.uid())
  ));

-- ============================================================================
-- WAITLIST_REQUESTS has been REMOVED. There is no longer a manual
-- name/email/phone capture form anywhere on the site - every "request an
-- account" CTA triggers Google auth directly (see lib/googleAuth.js), which
-- creates a real row in `users` above. access_granted defaulting to false
-- is what keeps this safe pre-launch - see app/api/auth/callback
-- and middleware.js.
-- ============================================================================
