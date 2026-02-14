-- Allow store owners and members to view orders for their stores
DROP POLICY IF EXISTS "Store members can view orders" ON public.orders;
CREATE POLICY "Store members can view orders" ON public.orders
FOR SELECT
USING (
  store_id IN (
    SELECT store_id FROM public.store_members WHERE user_id = auth.uid()
  )
  OR
  store_id IN (
    SELECT id FROM public.stores WHERE owner_id = auth.uid()
  )
);

-- Allow store members to update orders (e.g. status)
DROP POLICY IF EXISTS "Store members can update orders" ON public.orders;
CREATE POLICY "Store members can update orders" ON public.orders
FOR UPDATE
USING (
  store_id IN (
    SELECT store_id FROM public.store_members WHERE user_id = auth.uid()
  )
  OR
  store_id IN (
    SELECT id FROM public.stores WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  store_id IN (
    SELECT store_id FROM public.store_members WHERE user_id = auth.uid()
  )
  OR
  store_id IN (
    SELECT id FROM public.stores WHERE owner_id = auth.uid()
  )
);

-- Allow store members to insert orders (Manual entry)
DROP POLICY IF EXISTS "Store members can insert orders" ON public.orders;
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

-- --------------------------------------------------------
-- Order Items Policies
-- --------------------------------------------------------

-- Allow store members to view order items
DROP POLICY IF EXISTS "Store members can view order items" ON public.order_items;
CREATE POLICY "Store members can view order items" ON public.order_items
FOR SELECT
USING (
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

-- Allow store members to insert order items
DROP POLICY IF EXISTS "Store members can insert order items" ON public.order_items;
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

-- --------------------------------------------------------
-- Customers Policies (Ensure they can search/create)
-- --------------------------------------------------------

DROP POLICY IF EXISTS "Store members can view customers" ON public.customers;
CREATE POLICY "Store members can view customers" ON public.customers
FOR SELECT
USING (
  store_id IN (
    SELECT store_id FROM public.store_members WHERE user_id = auth.uid()
  )
  OR
  store_id IN (
    SELECT id FROM public.stores WHERE owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Store members can create customers" ON public.customers;
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
