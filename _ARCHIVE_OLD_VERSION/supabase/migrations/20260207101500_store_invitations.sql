-- Create store_invitations table
create table if not exists public.store_invitations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'editor', 'support')),
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.store_invitations enable row level security;

-- Policies for store_invitations
create policy "Store owners can manage invitations"
  on public.store_invitations
  for all
  using (auth.uid() in (
    select owner_id from public.stores where id = store_id
  ));

create policy "Invited users can view their own invitations by token"
  on public.store_invitations
  for select
  using (true); -- Ideally restrict by token match in function, but for select by token needs public access or function

-- Function to handle accepting invitation
create or replace function public.accept_store_invitation(
  p_token text
)
returns void
language plpgsql
security definer
as $$
declare
  v_invitation public.store_invitations%rowtype;
  v_user_id uuid;
begin
  -- Get current user
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Get invitation
  select * into v_invitation
  from public.store_invitations
  where token = p_token
  and status = 'pending'
  and expires_at > now();

  if v_invitation.id is null then
    raise exception 'Invalid or expired invitation';
  end if;

  -- Insert into store_members
  insert into public.store_members (store_id, user_id, role)
  values (v_invitation.store_id, v_user_id, v_invitation.role)
  on conflict (store_id, user_id) do update
  set role = v_invitation.role;

  -- Update invitation status
  update public.store_invitations
  set status = 'accepted', updated_at = now()
  where id = v_invitation.id;
end;
$$;
