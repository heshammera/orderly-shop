-- Enable public access for storefront
-- This allows unauthenticated users to view active stores, products, and categories

-- 1. Stores
CREATE POLICY "Public can view active stores"
    ON public.stores
    FOR SELECT
    USING (status = 'active');

-- 2. Products
CREATE POLICY "Public can view active products"
    ON public.products
    FOR SELECT
    USING (status = 'active');

-- 3. Categories
CREATE POLICY "Public can view active categories"
    ON public.categories
    FOR SELECT
    USING (status = 'active');

-- 4. Product Categories (Junction table)
-- Allow public to view links between active products and active categories
CREATE POLICY "Public can view product_categories"
    ON public.product_categories
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE products.id = product_categories.product_id
            AND products.status = 'active'
        )
    );

-- 5. Product Images (if stored in a separate table, but they are JSONB in products currently)
-- No extra policy needed as they are part of the products table.

-- 6. Store Members (Public needs to see owner for some logic? No, usually not.)
-- We keep store_members private.

