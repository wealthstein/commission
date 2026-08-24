-- Run this directly in Supabase's SQL Editor.
--
-- The products -> campaigns rename, deferred since early in this project
-- as "large and risky relative to its value" (see README's Known Gaps).
-- Executed now, deliberately and completely - not just the table name,
-- but every foreign key column referencing it, every index/trigger/policy
-- name, and every SQL function whose BODY references the old names.
--
-- IMPORTANT: renaming a table does NOT automatically update function
-- bodies that reference it by text. Postgres function bodies are stored
-- as-is; a table rename only updates the underlying object, not the text
-- of every function that happens to mention its old name. Every function
-- below is fully rewritten with CREATE OR REPLACE, not just referenced -
-- skipping this step would leave those functions broken immediately
-- after the rename, referencing a table that no longer exists.
--
-- Column names WITHIN the table itself (product_type, product_url) are
-- deliberately left unchanged - product_type specifically risks real
-- confusion with affiliate_programs.conversion_goal (lead vs sale) if
-- renamed to something like campaign_type, and this migration is already
-- large enough without introducing that ambiguity for marginal benefit.

-- ============================================================================
-- 1. Rename the table itself
-- ============================================================================
alter table products rename to campaigns;

-- ============================================================================
-- 2. Rename the foreign key columns on tables that reference it
-- ============================================================================
alter table affiliate_programs rename column product_id to campaign_id;
alter table transactions rename column product_id to campaign_id;
alter table subscription_attribution rename column product_id to campaign_id;

-- ============================================================================
-- 3. Rename indexes for consistency (cosmetic, but leaving old names here
--    would be confusing to anyone reading the schema later)
-- ============================================================================
alter index idx_products_business rename to idx_campaigns_business;
alter index idx_products_status rename to idx_campaigns_status;
alter index idx_transactions_product rename to idx_transactions_campaign;

-- The partial index on affiliate_programs needs to be dropped and
-- recreated - its definition references the column name directly, and a
-- column rename alone does not rewrite an index's own name.
drop index if exists idx_affiliate_programs_product_active;
create unique index idx_affiliate_programs_campaign_active
  on affiliate_programs(campaign_id) where status = 'active';

-- ============================================================================
-- 4. Rename the updated_at trigger for consistency
-- ============================================================================
drop trigger if exists trg_touch_products on campaigns;
create trigger trg_touch_campaigns before update on campaigns
  for each row execute function fn_touch_updated_at();

-- ============================================================================
-- 5. Rename RLS policies for consistency
-- ============================================================================
drop policy if exists products_public_read on campaigns;
create policy campaigns_public_read on campaigns for select using (status = 'active');

drop policy if exists products_owner_manage on campaigns;
create policy campaigns_owner_manage on campaigns for all
  using (business_id in (
    select id from businesses where owner_id in (select id from users where auth_user_id = auth.uid())
  ));

-- Three more policies found in a broader sweep, on OTHER tables, that
-- also reference products/product_id by text in their body - explicitly
-- rewritten rather than assumed to auto-update.
drop policy if exists custom_fields_manage on campaign_custom_fields;
create policy custom_fields_manage on campaign_custom_fields for all
  using (
    affiliate_program_id in (
      select ap.id from affiliate_programs ap
      join campaigns c on c.id = ap.campaign_id
      join businesses b on b.id = c.business_id
      where b.owner_id in (select id from users where auth_user_id = auth.uid())
    )
  );

drop policy if exists affiliate_programs_owner_manage on affiliate_programs;
create policy affiliate_programs_owner_manage on affiliate_programs for all
  using (
    campaign_id in (
      select c.id from campaigns c
      join businesses b on b.id = c.business_id
      where b.owner_id in (select id from users where auth_user_id = auth.uid())
    )
  );

drop policy if exists leads_program_owner_select on leads;
create policy leads_program_owner_select on leads for select
  using (program_id in (
    select ap.id from affiliate_programs ap
    join campaigns c on c.id = ap.campaign_id
    join businesses b on b.id = c.business_id
    where b.owner_id in (select id from users where auth_user_id = auth.uid())
  ));

-- ============================================================================
-- 6. Rewrite every function whose body references the old table/column
--    names by text
-- ============================================================================

-- fn_enforce_affiliate_cap - joined through products/product_id twice
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
  join campaigns c on c.id = ap.campaign_id
  join businesses b on b.id = c.business_id
  where ap.id = new.program_id;

  v_cap := case v_plan
    when 'free' then 5
    when 'pro' then 25
    else null -- 'plus' (Large) = unlimited
  end;

  if v_cap is not null then
    select exists (
      select 1 from affiliate_enrollments ae
      join affiliate_programs ap2 on ap2.id = ae.program_id
      join campaigns c2 on c2.id = ap2.campaign_id
      where c2.business_id = v_business_id and ae.affiliate_id = new.affiliate_id
    ) into v_already_counted;

    if not v_already_counted then
      select count(distinct ae.affiliate_id) into v_current_count
      from affiliate_enrollments ae
      join affiliate_programs ap2 on ap2.id = ae.program_id
      join campaigns c2 on c2.id = ap2.campaign_id
      where c2.business_id = v_business_id;

      if v_current_count >= v_cap then
        raise exception 'This business has reached its plan''s affiliate limit (%). Upgrade to add more affiliates.', v_cap;
      end if;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- business_has_active_campaign - joined through products/product_id once
create or replace function business_has_active_campaign(check_business_id uuid)
returns boolean as $$
  select exists (
    select 1 from campaigns c
    join affiliate_programs ap on ap.campaign_id = c.id
    where c.business_id = check_business_id and ap.status = 'active'
  );
$$ language sql security definer stable;

-- fn_enforce_attribution_ceiling - looked up the business's plan through
-- products/product_id (see migration_attribution_window_ceiling.sql)
create or replace function fn_enforce_attribution_ceiling()
returns trigger as $$
declare
  v_plan text;
  v_ceiling int;
begin
  select b.plan into v_plan
  from campaigns c
  join businesses b on b.id = c.business_id
  where c.id = new.campaign_id;

  v_ceiling := case v_plan
    when 'free' then 30   -- Small
    else 90                -- Medium ('pro') and Large ('plus')
  end;

  if new.attribution_days > v_ceiling then
    new.attribution_days := v_ceiling;
  end if;

  return new;
end;
$$ language plpgsql security definer;
