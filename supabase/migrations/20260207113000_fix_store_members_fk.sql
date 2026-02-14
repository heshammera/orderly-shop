-- Add foreign key relationship for store_members.user_id -> profiles.id
-- This allows us to join store_members with profiles in queries
alter table public.store_members
add constraint store_members_user_id_fkey
foreign key (user_id)
references public.profiles (id)
on delete cascade;
