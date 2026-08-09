-- Run this directly in Supabase's SQL Editor. Fixes both "new row
-- violates row-level security policy for table affiliate_programs" AND
-- Discover showing no campaigns - affiliate_programs had RLS enabled with
-- zero policies, so every insert AND every read was silently blocked.
--
-- Simplified to not reference business_team_members - Team Management is
-- fully disabled right now (see app/api/team/invite/route.js), so there's
-- no way to actually have an active team admin yet. If Team Management
-- comes back later, re-add that clause then.

drop policy if exists affiliate_programs_public_read on affiliate_programs;
create policy affiliate_programs_public_read on affiliate_programs for select using (status = 'active');

drop policy if exists affiliate_programs_owner_manage on affiliate_programs;
create policy affiliate_programs_owner_manage on affiliate_programs for all
  using (
    product_id in (
      select p.id from products p
      join businesses b on b.id = p.business_id
      where b.owner_id in (select id from users where auth_user_id = auth.uid())
    )
  );
