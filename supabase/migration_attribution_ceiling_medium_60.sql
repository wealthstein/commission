-- Run this directly in Supabase's SQL Editor.
--
-- Differentiates Medium from Large on attribution window ceiling - they
-- previously shared the same 90-day cap, giving Large no real advantage
-- over Medium on this specific dimension. Now: Small 30, Medium 60,
-- Large 90 - a genuinely graduated structure across all three plans.
--
-- Replaces the function from migration_attribution_window_ceiling.sql;
-- safe to run even if that migration was already applied, since
-- CREATE OR REPLACE just updates the existing function in place.
create or replace function fn_enforce_attribution_ceiling()
returns trigger as $$
declare
  v_plan text;
  v_ceiling int;
begin
  select b.plan into v_plan
  from products p
  join businesses b on b.id = p.business_id
  where p.id = new.product_id;

  v_ceiling := case v_plan
    when 'free' then 30   -- Small
    when 'pro' then 60     -- Medium
    else 90                -- Large ('plus')
  end;

  if new.attribution_days > v_ceiling then
    new.attribution_days := v_ceiling;
  end if;

  return new;
end;
$$ language plpgsql security definer;
