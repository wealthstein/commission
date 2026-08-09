-- Run this directly in Supabase's SQL Editor. Creates the storage bucket
-- the new business logo upload feature needs (Account page -> Business
-- tab). Without this, uploads will fail with a "bucket not found" error.

insert into storage.buckets (id, name, public)
values ('business-logos', 'business-logos', true)
on conflict (id) do nothing;

-- Anyone can view logos (they're shown publicly on campaign pages).
drop policy if exists "business-logos public read" on storage.objects;
create policy "business-logos public read" on storage.objects for select
  using (bucket_id = 'business-logos');

-- Only a signed-in user can upload - app code scopes the actual upload
-- path to their own business.id, but this policy just needs to allow any
-- authenticated user to write into this bucket at all.
drop policy if exists "business-logos authenticated upload" on storage.objects;
create policy "business-logos authenticated upload" on storage.objects for insert
  with check (bucket_id = 'business-logos' and auth.role() = 'authenticated');

drop policy if exists "business-logos authenticated update" on storage.objects;
create policy "business-logos authenticated update" on storage.objects for update
  using (bucket_id = 'business-logos' and auth.role() = 'authenticated');
