-- Force Enable RLS to be sure
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- DROP ALL existing policies on orders to ensure a clean slate
drop policy if exists "Store members can view orders" on public.orders;
drop policy if exists "Store members can update orders" on public.orders;
drop policy if exists "Store owners can manage orders" on public.orders;
drop policy if exists "Public/Customers can create orders" on public.orders;
drop policy if exists "Customers can view their own orders" on public.orders;

-- DROP ALL existing policies on order_items
drop policy if exists "Store members can view order items" on public.order_items;
drop policy if exists "Store owners can manage order_items" on public.order_items;
drop policy if exists "Store owners can manage order items" on public.order_items;
drop policy if exists "Public/Customers can create order items" on public.order_items;
drop policy if exists "Customers can view their own order items" on public.order_items;


-- === ORDERS POLICIES ===

-- 1. Store Owners (Full Access)
create policy "Store owners can manage orders"
    on public.orders for all
    using ( exists (
        select 1 from public.stores 
        where stores.id = orders.store_id 
        and stores.owner_id = auth.uid()
    ));

-- 2. Store Members (View Access)
create policy "Store members can view orders"
    on public.orders for select
    using ( public.is_store_member(auth.uid(), store_id) );

-- 3. Customers (View Own)
create policy "Customers can view their own orders"
    on public.orders for select
    using ( auth.uid() = customer_id );

-- 4. Public/Customers (Create)
create policy "Public/Customers can create orders"
    on public.orders for insert
    with check ( true ); 


-- === ORDER ITEMS POLICIES ===

-- 1. Store Owners (Full Access)
create policy "Store owners can manage order items"
    on public.order_items for all
    using ( exists (
        select 1 from public.orders
        join public.stores on stores.id = orders.store_id
        where orders.id = order_items.order_id
        and stores.owner_id = auth.uid()
    ));

-- 2. Store Members (View Access)
create policy "Store members can view order items"
    on public.order_items for select
    using ( exists (
        select 1 from public.orders 
        where orders.id = order_items.order_id 
        and public.is_store_member(auth.uid(), orders.store_id)
    ));

-- 3. Customers (View Own)
create policy "Customers can view their own order items"
    on public.order_items for select
    using ( exists (
        select 1 from public.orders
        where orders.id = order_items.order_id
        and orders.customer_id = auth.uid()
    ));

-- 4. Public/Customers (Create)
create policy "Public/Customers can create order items"
    on public.order_items for insert
    with check ( exists (
        select 1 from public.orders
        where orders.id = order_items.order_id
    ));
