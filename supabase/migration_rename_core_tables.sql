-- ============================================================================
-- RENAME CORE/DOMAIN TABLES — run this in Supabase's SQL editor LAST, after
-- schema.sql and every migration_*.sql file has already been applied
-- (including migration_rename_products_to_campaigns.sql and
-- migration_inbox.sql) - several of the redefinitions below depend on
-- tables/columns those migrations create.
--
-- Uses ALTER TABLE ... RENAME TO, which Postgres handles as a metadata-only
-- operation: all data, foreign keys, indexes, and RLS policies attached to
-- the table move with it automatically. Nothing is dropped or recreated,
-- so this is safe to run against a database with real data in it.
--
-- Every application-code reference to the old names (Supabase .from() calls
-- throughout app/ and lib/) is updated in the same commit as this file -
-- do not run this against a database the app is actively serving traffic
-- against without deploying both together, since old-name queries will
-- start failing the moment the rename lands.
--
-- SAFETY NOTES before running this against a live/production database:
--   1. Take a manual backup (or confirm Supabase's point-in-time recovery
--      covers this moment) before running - this is easily reversible in
--      principle (rename back - see migration_rename_core_tables_ROLLBACK.sql
--      in this same folder), but you want an actual restore point, not
--      just a plan, before touching a live schema.
--   2. Wrapped in an explicit begin;/commit; below: every statement either
--      all commits together, or (if anything errors - a typo, an
--      unexpected existing state) Postgres rolls the whole transaction
--      back automatically and your database is left exactly as it was,
--      not half-renamed.
--   3. This still needs to land close together with deploying the
--      matching app code (already updated in this repo) - old code
--      querying by old table names will start getting real errors the
--      moment this transaction commits. A brief low-traffic window,
--      immediately followed by deploying, is the safe order.
--   4. If your Supabase plan supports database branching, testing this
--      exact file against a branch first is the safest possible check
--      before running it for real.
-- ============================================================================

begin;

-- Shared tenancy tables
alter table if exists users rename to core_users;
alter table if exists businesses rename to core_businesses;
alter table if exists business_team_members rename to core_business_team_members;

-- Affiliate marketplace / attribution domain
-- NOTE: the live table is "campaigns", not "products" - it was already
-- renamed by migration_rename_products_to_campaigns.sql, which must run
-- before this file. (schema.sql's own "create table products" is the
-- pre-rename base definition; campaigns is the actual current name once
-- every migration_*.sql file has been applied, per this repo's README.)
alter table if exists campaigns rename to affiliate_campaigns;
alter table if exists marketing_assets rename to affiliate_marketing_assets;
alter table if exists referral_clicks rename to affiliate_referral_clicks;
alter table if exists customers rename to affiliate_customers;
alter table if exists campaign_custom_fields rename to affiliate_campaign_custom_fields;
alter table if exists leads rename to affiliate_leads;
alter table if exists manual_sale_confirmations rename to affiliate_manual_sale_confirmations;
-- affiliate_programs and affiliate_enrollments already carry the affiliate_ prefix - no change needed.

-- Billing / money-movement domain
alter table if exists transactions rename to billing_transactions;
alter table if exists commissions rename to billing_commissions;
alter table if exists payouts rename to billing_payouts;
alter table if exists payout_commissions rename to billing_payout_commissions;
alter table if exists wallet_transactions rename to billing_wallet_transactions;
alter table if exists user_referral_rewards rename to billing_user_referral_rewards;
alter table if exists wallet_funding_nudges rename to billing_wallet_funding_nudges;
-- Bridges Paystack subscription renewals back to product/affiliate
-- attribution (see migration_subscription_attribution.sql) - no RLS
-- policies or functions reference it by name elsewhere (checked), so a
-- plain rename is all this one needs.
alter table if exists subscription_attribution rename to billing_subscription_attribution;

-- Growth / pre-signup prospecting (admin-only, not tenant data)
alter table if exists cold_outreach_contacts rename to growth_cold_outreach_contacts;
-- These three don't have a CREATE TABLE anywhere in this repo's migration
-- history, and schema.sql even has a comment claiming notify_requests/
-- waitlist_requests were removed - but both are still live, still
-- actively written to by real routes (/api/seo-targets/notify,
-- /api/waitlist/join), confirmed against the actual live database rather
-- than the (out of date, in this respect) committed schema. Likely
-- created directly via the Supabase dashboard at some point rather than
-- through a committed migration. Those two routes already query them
-- under these exact growth_-prefixed names - until this runs, they're
-- broken against the live database (querying a name that doesn't exist
-- yet), so this isn't a cosmetic rename for these three, it's fixing a
-- live mismatch. Worth adding a proper CREATE TABLE for all three to
-- schema.sql separately so it stops silently disagreeing with reality,
-- but that's a documentation fix, not part of this rename.
alter table if exists seo_keyword_targets rename to growth_seo_keyword_targets;
alter table if exists waitlist_requests rename to growth_waitlist_requests;
alter table if exists notify_requests rename to growth_notify_requests;

-- ============================================================================
-- REDEFINE every function/policy whose BODY references a renamed table.
--
-- Postgres tracks table dependencies by OID for foreign keys, views, and
-- plain SQL (language sql) function/policy expressions — those all follow
-- a rename automatically. PL/pgSQL function bodies are stored as opaque
-- text and do NOT get rewritten on rename, so anything in `language
-- plpgsql` below would silently break without this. Being conservative:
-- every function/policy that touches a renamed table is redefined here
-- explicitly, regardless of which category it technically falls in.
--
-- Also takes the opportunity to fix a few things that were deliberately
-- limited to owner-only "until Team Management comes back" (see the
-- comments this replaces in schema.sql and migration_rename_products_to_campaigns.sql) -
-- it just came back (see app/api/team/invite, restored this same session),
-- so affiliate_programs / campaign_custom_fields / leads management now
-- correctly includes active team members too, via is_business_member()
-- (defined in migration_inbox.sql — reused here rather than duplicating
-- the owner-or-active-member subquery a fourth time).
-- ============================================================================

-- fn_charge_wallet (schema.sql) - businesses, wallet_transactions
create or replace function fn_charge_wallet(
  p_business_id uuid,
  p_amount numeric,
  p_type text,
  p_lead_id uuid default null,
  p_transaction_id uuid default null,
  p_paystack_reference text default null,
  p_gross_amount numeric default null,
  p_platform_fee numeric default null
) returns billing_wallet_transactions as $$
declare
  v_balance numeric;
  v_txn billing_wallet_transactions;
begin
  select wallet_balance_naira into v_balance from core_businesses where id = p_business_id for update;
  if v_balance is null then
    raise exception 'Business % not found', p_business_id;
  end if;
  if v_balance + p_amount < 0 then
    raise exception 'Insufficient wallet balance: have %, need %', v_balance, -p_amount;
  end if;

  update core_businesses set wallet_balance_naira = wallet_balance_naira + p_amount where id = p_business_id;

  insert into billing_wallet_transactions (
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

-- fn_enforce_affiliate_cap (latest version: migration_rename_products_to_campaigns.sql) - businesses
create or replace function fn_enforce_affiliate_cap()
returns trigger as $$
declare
  v_business_id uuid;
  v_plan text;
  v_cap int;
  v_current_count int;
  v_already_counted boolean;
begin
  select b.id, b.plan into v_business_id, v_plan
  from affiliate_programs ap
  join affiliate_campaigns c on c.id = ap.campaign_id
  join core_businesses b on b.id = c.business_id
  where ap.id = new.program_id;

  v_cap := case v_plan
    when 'free' then 5
    when 'pro' then 25
    else null
  end;

  if v_cap is not null then
    select exists (
      select 1 from affiliate_enrollments ae
      join affiliate_programs ap2 on ap2.id = ae.program_id
      join affiliate_campaigns c2 on c2.id = ap2.campaign_id
      where c2.business_id = v_business_id and ae.affiliate_id = new.affiliate_id
    ) into v_already_counted;

    if not v_already_counted then
      select count(distinct ae.affiliate_id) into v_current_count
      from affiliate_enrollments ae
      join affiliate_programs ap2 on ap2.id = ae.program_id
      join affiliate_campaigns c2 on c2.id = ap2.campaign_id
      where c2.business_id = v_business_id;

      if v_current_count >= v_cap then
        raise exception 'This business has reached its plan''s affiliate limit (%). Upgrade to add more affiliates.', v_cap;
      end if;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- business_has_active_campaign (latest version: migration_rename_products_to_campaigns.sql) - businesses, campaigns
create or replace function business_has_active_campaign(check_business_id uuid)
returns boolean as $$
  select exists (
    select 1 from affiliate_campaigns c
    join affiliate_programs ap on ap.campaign_id = c.id
    where c.business_id = check_business_id and ap.status = 'active'
  );
$$ language sql security definer stable;

-- fn_enforce_attribution_ceiling (latest version: migration_attribution_ceiling_medium_60.sql -
-- the graduated 30/60/90 logic - but that file still said "products"/"product_id",
-- predating the campaigns rename; fixed here to the current names while
-- keeping its graduated ceiling, which is the intended current behavior)
create or replace function fn_enforce_attribution_ceiling()
returns trigger as $$
declare
  v_plan text;
  v_ceiling int;
begin
  select b.plan into v_plan
  from affiliate_campaigns c
  join core_businesses b on b.id = c.business_id
  where c.id = new.campaign_id;

  v_ceiling := case v_plan
    when 'free' then 30
    when 'pro' then 60
    else 90
  end;

  if new.attribution_days > v_ceiling then
    new.attribution_days := v_ceiling;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Team-management-aware policies (owner OR active team member, via
-- is_business_member() from migration_inbox.sql) - previously owner-only
-- "until Team Management comes back". It just did.
drop policy if exists affiliate_programs_owner_manage on affiliate_programs;
create policy affiliate_programs_owner_manage on affiliate_programs for all
  using (
    campaign_id in (select id from affiliate_campaigns where is_business_member(business_id))
  );

drop policy if exists custom_fields_manage on affiliate_campaign_custom_fields;
create policy custom_fields_manage on affiliate_campaign_custom_fields for all
  using (
    affiliate_program_id in (
      select ap.id from affiliate_programs ap
      join affiliate_campaigns c on c.id = ap.campaign_id
      where is_business_member(c.business_id)
    )
  );

drop policy if exists leads_program_owner_select on affiliate_leads;
create policy leads_program_owner_select on affiliate_leads for select
  using (
    program_id in (
      select ap.id from affiliate_programs ap
      join affiliate_campaigns c on c.id = ap.campaign_id
      where is_business_member(c.business_id)
    )
  );

-- subscription_attribution's FKs (product_id -> campaign_id already renamed
-- by migration_rename_products_to_campaigns.sql; renamed to
-- billing_subscription_attribution above - see that rename for why no
-- further function/policy redefinition is needed here).

do $$
declare
  old_names text[] := array['users','businesses','business_team_members','campaigns',
    'marketing_assets','referral_clicks','customers','campaign_custom_fields','leads',
    'manual_sale_confirmations','transactions','commissions','payouts','payout_commissions',
    'wallet_transactions','user_referral_rewards','wallet_funding_nudges','cold_outreach_contacts',
    'subscription_attribution','seo_keyword_targets','notify_requests','waitlist_requests'];
  n text;
begin
  foreach n in array old_names loop
    if to_regclass('public.' || n) is not null then
      raise notice 'STILL PRESENT under old name: % - rename did not apply, check for a typo above', n;
    end if;
  end loop;
end $$;

commit;
