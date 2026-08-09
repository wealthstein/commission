-- Run this directly in Supabase's SQL Editor. This is the exact fix for
-- both "new row violates row-level security policy for table
-- affiliate_programs" AND Discover showing no campaigns - affiliate_programs
-- had RLS enabled with zero policies, so every insert AND every read was
-- silently blocked by Postgres's default-deny behavior.

drop policy if exists affiliate_programs_public_read on affiliate_programs;
create policy affiliate_programs_public_read on affiliate_programs for select using (status = 'active');

drop policy if exists affiliate_programs_owner_manage on affiliate_programs;
create policy affiliate_programs_owner_manage on affiliate_programs for all
  using (
    product_id in (
      select p.id from products p
      join businesses b on b.id = p.business_id
      where b.owner_id in (select id from users where auth_user_id = auth.uid())
      union
      select p.id from products p
      where p.business_id in (
        select business_id from business_team_members
        where user_id in (select id from users where auth_user_id = auth.uid()) and status = 'active'
      )
    )
  );
