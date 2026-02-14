-- Enable public/customer access to create orders during checkout
-- Note: 'public' role includes unauthenticated users (guests)

-- Orders Policies
CREATE POLICY "Public/Customers can create orders" ON public.orders
    FOR INSERT
    WITH CHECK (true); -- Allow creation by anyone (Store validation via Backend/Edge Function logically, or trust client for MVP with checks)

CREATE POLICY "Customers can view their own orders" ON public.orders
    FOR SELECT
    USING (auth.uid() = customer_id);

-- Order Items Policies
CREATE POLICY "Public/Customers can create order items" ON public.order_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            -- AND (orders.customer_id = auth.uid() OR orders.id IS NOT NULL) -- Simple check: if they can create the order, they can add items?
            -- Since order is created in same transaction or flow, RLS on insert to order_Items usually requires visibility of Order.
            -- If user just inserted Order, they might not 'SElECT' it if they are guest.
            -- So we allow Insert if Order exists (UUID reference check is implicit in FK but RLS adds layer).
        )
    );

CREATE POLICY "Customers can view their own order items" ON public.order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.customer_id = auth.uid()
        )
    );

-- Also ensure Customers table has proper access if we create customers on fly
CREATE POLICY "Public can create customers" ON public.customers
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Customers can update own profile" ON public.customers
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Customers can view own profile" ON public.customers
    FOR SELECT
    USING (auth.uid() = id);
