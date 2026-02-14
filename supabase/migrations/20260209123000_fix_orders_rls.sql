-- Drop ALL potential existing policies to ensure clean slate
drop policy if exists "Store members can view orders" on public.orders;
drop policy if exists "Store members can update orders" on public.orders;
drop policy if exists "Store owners can manage orders" on public.orders;

drop policy if exists "Store members can view order items" on public.order_items;
drop policy if exists "Store owners can manage order_items" on public.order_items;
drop policy if exists "Store owners can manage order items" on public.order_items; -- Handle potential naming variations

-- 1. Policy for Team Members (using Security Definer function)
create policy "Store members can view orders"
    on public.orders for select
    using ( public.is_store_member(auth.uid(), store_id) );

-- 2. Policy for Store Owners (Direct check, mirrors customers table)
create policy "Store owners can manage orders"
    on public.orders for all
    using ( exists (
        select 1 from public.stores 
        where stores.id = orders.store_id 
        and stores.owner_id = auth.uid()
    ));

-- Order Items Policies

-- 1. Team Members
create policy "Store members can view order items"
    on public.order_items for select
    using ( exists (
        select 1 from public.orders 
        where orders.id = order_items.order_id 
        and public.is_store_member(auth.uid(), orders.store_id)
    ));

-- 2. Store Owners
create policy "Store owners can manage order items"
    on public.order_items for all
    using ( exists (
        select 1 from public.orders
        join public.stores on stores.id = orders.store_id
        and orders.id = order_items.order_id
        and stores.owner_id = auth.uid()
    ));
