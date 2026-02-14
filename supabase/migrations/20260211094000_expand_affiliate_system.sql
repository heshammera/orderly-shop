-- Add user connection to affiliates
alter table public.affiliates 
add column if not exists user_id uuid references auth.users(id),
add column if not exists payout_settings jsonb default '{}'::jsonb;

-- Create Affiliate Payouts Table
create table if not exists public.affiliate_payouts (
    id uuid not null default gen_random_uuid(),
    affiliate_id uuid not null references public.affiliates(id) on delete cascade,
    amount numeric not null check (amount > 0),
    status text not null default 'pending' check (status in ('pending', 'paid', 'rejected')),
    method text not null, -- 'bank', 'paypal', etc.
    notes text,
    processed_at timestamptz,
    created_at timestamptz not null default now(),
    constraint affiliate_payouts_pkey primary key (id)
);

-- Enable RLS for Payouts
alter table public.affiliate_payouts enable row level security;

create policy "Store owners can manage payouts"
    on public.affiliate_payouts for all
    using (exists (
        select 1 from public.affiliates
        join public.store_members on store_members.store_id = affiliates.store_id
        where affiliates.id = affiliate_payouts.affiliate_id
        and store_members.user_id = auth.uid()
    ));

-- Create Affiliate Visits Table (Tracking)
create table if not exists public.affiliate_visits (
    id uuid not null default gen_random_uuid(),
    affiliate_id uuid not null references public.affiliates(id) on delete cascade,
    visitor_ip text,
    user_agent text,
    referrer_url text,
    converted boolean default false,
    created_at timestamptz not null default now(),
    constraint affiliate_visits_pkey primary key (id)
);

-- Enable RLS for Visits
alter table public.affiliate_visits enable row level security;

create policy "Store owners can view visits"
    on public.affiliate_visits for select
    using (exists (
        select 1 from public.affiliates
        join public.store_members on store_members.store_id = affiliates.store_id
        where affiliates.id = affiliate_visits.affiliate_id
        and store_members.user_id = auth.uid()
    ));

-- Public can insert visits (tracking pixel)
create policy "Public can track visits"
    on public.affiliate_visits for insert
    with check (true);
