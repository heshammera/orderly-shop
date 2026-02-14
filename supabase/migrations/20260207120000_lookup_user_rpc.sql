-- Secure function to look up a user by email
-- Returns minimal info (ID, Name) to allow adding them to a store
create or replace function public.lookup_user_by_email(search_email text)
returns table (
  id uuid,
  email text,
  full_name text
) 
security definer
set search_path = public
language plpgsql
as $$
begin
  return query
  select 
    p.id,
    p.email,
    p.full_name
  from public.profiles p
  where p.email = search_email;
end;
$$;
