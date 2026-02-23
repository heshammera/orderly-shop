-- ============================================
-- FIX: Restore public INSERT policies for checkout
-- The migration 20260210100000_orders_rls_fix.sql overwrote
-- the public INSERT policies, requiring auth.uid() store membership.
-- This blocked anonymous customers from placing orders on the storefront.
-- ============================================

-- ========== ORDERS: Allow public/anonymous INSERT ==========
DROP POLICY IF EXISTS "Store members can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public/Customers can create orders" ON public.orders;

-- Store owners/members can still insert (manual orders from dashboard)
CREATE POLICY "Store members can insert orders" ON public.orders
FOR INSERT
WITH CHECK (
  store_id IN (
    SELECT store_id FROM public.store_members WHERE user_id = auth.uid()
  )
  OR
  store_id IN (
    SELECT id FROM public.stores WHERE owner_id = auth.uid()
  )
);

-- Public/anonymous users can create orders (storefront checkout)
CREATE POLICY "Public/Customers can create orders" ON public.orders
FOR INSERT
WITH CHECK (true);


-- ========== ORDER ITEMS: Allow public/anonymous INSERT ==========
DROP POLICY IF EXISTS "Store members can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Public/Customers can create order items" ON public.order_items;

-- Store owners/members can insert order items
CREATE POLICY "Store members can insert order items" ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (
      orders.store_id IN (
        SELECT store_id FROM public.store_members WHERE user_id = auth.uid()
      )
      OR
      orders.store_id IN (
        SELECT id FROM public.stores WHERE owner_id = auth.uid()
      )
    )
  )
);

-- Public/anonymous users can create order items (checkout)
CREATE POLICY "Public/Customers can create order items" ON public.order_items
FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
));


-- ========== CUSTOMERS: Allow public/anonymous INSERT ==========
DROP POLICY IF EXISTS "Store members can create customers" ON public.customers;
DROP POLICY IF EXISTS "Public can create customers" ON public.customers;

-- Store owners/members can create customers
CREATE POLICY "Store members can create customers" ON public.customers
FOR INSERT
WITH CHECK (
  store_id IN (
    SELECT store_id FROM public.store_members WHERE user_id = auth.uid()
  )
  OR
  store_id IN (
    SELECT id FROM public.stores WHERE owner_id = auth.uid()
  )
);

-- Public/anonymous users can create customers (during checkout)
CREATE POLICY "Public can create customers" ON public.customers
FOR INSERT
WITH CHECK (true);


-- ========== CUSTOMERS: Allow public SELECT by phone (for checkout lookup) ==========
DROP POLICY IF EXISTS "Public can lookup customers by phone" ON public.customers;
CREATE POLICY "Public can lookup customers by phone" ON public.customers
FOR SELECT
USING (true);
