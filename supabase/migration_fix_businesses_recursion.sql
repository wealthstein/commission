-- Run this directly in Supabase's SQL Editor. Fixes "infinite recursion
-- detected in policy for relation businesses" - the previous
-- businesses_public_read policy queried products directly, but products'
-- own RLS policy queries businesses right back, creating a loop.
--
-- This wraps the check in a SECURITY DEFINER function, which evaluates
-- with its own privilege context instead of re-triggering the caller's
-- RLS chain - the standard Postgres fix for this kind of circular
-- cross-table policy reference.

create or replace function business_has_active_campaign(check_business_id uuid)
returns boolean as $$
  select exists (
    select 1 from products p
    join affiliate_programs ap on ap.product_id = p.id
    where p.business_id = check_business_id and ap.status = 'active'
  );
$$ language sql security definer stable;

drop policy if exists businesses_public_read on businesses;
create policy businesses_public_read on businesses for select
  using (business_has_active_campaign(id));
