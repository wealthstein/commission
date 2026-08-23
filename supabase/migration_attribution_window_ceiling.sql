-- Run this directly in Supabase's SQL Editor.
--
-- Enforces the plan-based ceiling on attribution_days server-side, not
-- just in the campaign creation form's UI. Campaign creation currently
-- inserts directly from the client (see app/dashboard/campaigns/new),
-- so a UI-only cap would be trivially bypassable via a direct API call -
-- same reasoning as the existing affiliate-cap trigger
-- (fn_enforce_affiliate_cap), which this mirrors closely.
--
-- Small: 30 days max. Medium/Large: 90 days max. Clamps down to the
-- ceiling silently rather than rejecting the insert outright - a normal
-- user going through the actual form UI will never hit this (the form
-- itself won't let them pick an out-of-range value), so this exists
-- purely as a backstop against a direct bypass, not something a
-- legitimate flow should ever surface as an error.
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
    else 90                -- Medium ('pro') and Large ('plus')
  end;

  if new.attribution_days > v_ceiling then
    new.attribution_days := v_ceiling;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_enforce_attribution_ceiling on affiliate_programs;
create trigger trg_enforce_attribution_ceiling
  before insert or update on affiliate_programs
  for each row execute function fn_enforce_attribution_ceiling();
