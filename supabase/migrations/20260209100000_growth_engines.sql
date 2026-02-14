-- Drop tables if they exist to ensure clean creation (fixing potential migration errors)
drop table if exists public.loyalty_transactions;
drop table if exists public.loyalty_points;
drop table if exists public.affiliate_conversions;
drop table if exists public.affiliates;

-- Add Loyalty Settings to Stores
alter table public.stores 
add column if not exists loyalty_program_enabled boolean default false,
add column if not exists loyalty_earning_rate numeric default 1,
add column if not exists loyalty_redemption_rate numeric default 100;

-- Create Affiliates Table
create table if not exists public.affiliates (
    id uuid not null default gen_random_uuid(),
    store_id uuid not null references public.stores(id) on delete cascade,
    name text not null,
    email text,
    code text not null,
    commission_rate numeric not null default 0,
    total_earnings numeric not null default 0,
    status text not null default 'active' check (status in ('active', 'inactive')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint affiliates_pkey primary key (id),
    constraint affiliates_code_key unique (store_id, code)
);

-- Enable RLS for Affiliates
alter table public.affiliates enable row level security;

create policy "Store owners can view their affiliates"
    on public.affiliates for select
    using (exists (
        select 1 from public.store_members
        where store_members.store_id = affiliates.store_id
        and store_members.user_id = auth.uid()
    ));

create policy "Store owners can manage their affiliates"
    on public.affiliates for all
    using (exists (
        select 1 from public.store_members
        where store_members.store_id = affiliates.store_id
        and store_members.user_id = auth.uid()
    ));

-- Create Affiliate Conversions Table (Track Sales)
create table if not exists public.affiliate_conversions (
    id uuid not null default gen_random_uuid(),
    affiliate_id uuid not null references public.affiliates(id) on delete cascade,
    order_id uuid not null, -- Can link to orders table if strictly coupled
    amount numeric not null,
    commission_amount numeric not null,
    status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
    created_at timestamptz not null default now(),
    constraint affiliate_conversions_pkey primary key (id)
);

-- Enable RLS for Conversions
alter table public.affiliate_conversions enable row level security;

create policy "Store owners can view conversions"
    on public.affiliate_conversions for select
    using (exists (
        select 1 from public.affiliates
        join public.store_members on store_members.store_id = affiliates.store_id
        where affiliates.id = affiliate_conversions.affiliate_id
        and store_members.user_id = auth.uid()
    ));

-- Create Loyalty Points Table
create table if not exists public.loyalty_points (
    id uuid not null default gen_random_uuid(),
    store_id uuid not null references public.stores(id) on delete cascade,
    customer_id uuid not null references public.customers(id) on delete cascade,
    points integer not null default 0,
    total_spent numeric not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint loyalty_points_pkey primary key (id),
    constraint loyalty_customer_key unique (store_id, customer_id)
);

-- Enable RLS for Loyalty
alter table public.loyalty_points enable row level security;

create policy "Store owners can view loyalty data"
    on public.loyalty_points for select
    using (exists (
        select 1 from public.store_members
        where store_members.store_id = loyalty_points.store_id
        and store_members.user_id = auth.uid()
    ));

-- Create Loyalty Transactions Table (History)
create table if not exists public.loyalty_transactions (
    id uuid not null default gen_random_uuid(),
    loyalty_id uuid not null references public.loyalty_points(id) on delete cascade,
    points integer not null, -- Positive for earn, Negative for redeem
    type text not null check (type in ('purchase', 'redemption', 'bonus', 'adjustment')),
    reference_id text, -- Order ID or other ref
    created_at timestamptz not null default now(),
    constraint loyalty_transactions_pkey primary key (id)
);

-- Enable RLS for Loyalty Transactions
alter table public.loyalty_transactions enable row level security;

create policy "Store owners can view loyalty transactions"
    on public.loyalty_transactions for select
    using (exists (
        select 1 from public.loyalty_points
        join public.store_members on store_members.store_id = loyalty_points.store_id
        where loyalty_points.id = loyalty_transactions.loyalty_id
        and store_members.user_id = auth.uid()
    ));
