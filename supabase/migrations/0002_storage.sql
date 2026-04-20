-- Storage bucket for product images (public read).
-- Apply via the Supabase SQL editor OR the Storage UI.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public read, authenticated upload. We scope uploads by tenant_id in the client.
drop policy if exists "product-images public read" on storage.objects;
create policy "product-images public read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product-images auth write" on storage.objects;
create policy "product-images auth write" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');

drop policy if exists "product-images auth update" on storage.objects;
create policy "product-images auth update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');
