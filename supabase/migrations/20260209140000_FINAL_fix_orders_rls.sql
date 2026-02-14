-- ============================================
-- FINAL FIX: Orders & Order Items RLS
-- Copy the EXACT working pattern from customers
-- ============================================

-- Step 1: Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename IN ('orders', 'order_items')) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || 
                CASE WHEN r.policyname LIKE '%order items%' OR r.policyname LIKE '%order_items%' 
                THEN 'order_items' ELSE 'orders' END;
    END LOOP;
END $$;

-- Step 2: Create SIMPLE policies (exact copy from customers pattern)

-- ========== ORDERS ==========

-- Allow Store Members to VIEW (using the working is_store_member function)
CREATE POLICY "Store members can view orders"
    ON public.orders FOR SELECT
    USING (is_store_member(auth.uid(), store_id));

-- Allow Store Owners to MANAGE (same pattern as customers)
CREATE POLICY "Store owners can manage orders"
    ON public.orders FOR ALL
    USING (EXISTS (
        SELECT 1 FROM stores 
        WHERE stores.id = orders.store_id 
        AND stores.owner_id = auth.uid()
    ));

-- Allow Customers to view their own orders
CREATE POLICY "Customers can view their own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = customer_id);

-- Allow Public/Customers to create orders (for checkout)
CREATE POLICY "Public/Customers can create orders"
    ON public.orders FOR INSERT
    WITH CHECK (true);


-- ========== ORDER ITEMS ==========

-- Allow Store Members to VIEW
CREATE POLICY "Store members can view order items"
    ON public.order_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id
        AND is_store_member(auth.uid(), orders.store_id)
    ));

-- Allow Store Owners to MANAGE
CREATE POLICY "Store owners can manage order items"
    ON public.order_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM orders
        JOIN stores ON stores.id = orders.store_id
        WHERE orders.id = order_items.order_id
        AND stores.owner_id = auth.uid()
    ));

-- Allow Customers to view their own order items
CREATE POLICY "Customers can view their own order items"
    ON public.order_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id
        AND orders.customer_id = auth.uid()
    ));

-- Allow Public/Customers to create order items (for checkout)
CREATE POLICY "Public/Customers can create order items"
    ON public.order_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id
    ));
