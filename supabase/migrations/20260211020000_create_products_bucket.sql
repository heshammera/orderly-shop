-- Create a storage bucket for products if it doesn't exist
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- Policy: Public Access
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
      and tablename = 'objects' 
      and policyname = 'Public Access'
  ) then
    create policy "Public Access"
      on storage.objects for select
      using ( bucket_id = 'products' );
  end if;
end $$;

-- Policy: Authenticated Users can upload
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
      and tablename = 'objects' 
      and policyname = 'Authenticated Users can upload'
  ) then
    create policy "Authenticated Users can upload"
      on storage.objects for insert
      with check ( bucket_id = 'products' and auth.role() = 'authenticated' );
  end if;
end $$;

-- Policy: Authenticated Users can update
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
      and tablename = 'objects' 
      and policyname = 'Authenticated Users can update'
  ) then
    create policy "Authenticated Users can update"
      on storage.objects for update
      with check ( bucket_id = 'products' and auth.role() = 'authenticated' );
  end if;
end $$;

-- Policy: Authenticated Users can delete
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
      and tablename = 'objects' 
      and policyname = 'Authenticated Users can delete'
  ) then
    create policy "Authenticated Users can delete"
      on storage.objects for delete
      using ( bucket_id = 'products' and auth.role() = 'authenticated' );
  end if;
end $$;
