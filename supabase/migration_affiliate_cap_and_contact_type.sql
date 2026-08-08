-- Run in Supabase's SQL Editor. Two separate changes, both safe to re-run.

-- 1. contact_type column on cold_outreach_contacts (e.g. "Real Estate
-- Developer", "Real Estate Consultant" - free text, not an enum).
alter table cold_outreach_contacts add column if not exists contact_type text;

-- 2. Affiliate cap enforcement - Small: 5, Medium: 25, Large: unlimited,
-- counted as DISTINCT affiliates across all of a business's programs
-- combined. Re-running this replaces the function/trigger cleanly.
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
  join products p on p.id = ap.product_id
  join businesses b on b.id = p.business_id
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
      join products p2 on p2.id = ap2.product_id
      where p2.business_id = v_business_id and ae.affiliate_id = new.affiliate_id
    ) into v_already_counted;

    if not v_already_counted then
      select count(distinct ae.affiliate_id) into v_current_count
      from affiliate_enrollments ae
      join affiliate_programs ap2 on ap2.id = ae.program_id
      join products p2 on p2.id = ap2.product_id
      where p2.business_id = v_business_id;

      if v_current_count >= v_cap then
        raise exception 'This business has reached its plan''s affiliate limit (%). Upgrade to add more affiliates.', v_cap;
      end if;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_enforce_affiliate_cap on affiliate_enrollments;
create trigger trg_enforce_affiliate_cap
  before insert on affiliate_enrollments
  for each row execute function fn_enforce_affiliate_cap();
