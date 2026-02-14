-- Drop old/duplicate policies that use underscores or different naming conventions
-- These were created in 20260202032615... and might conflict or be redundant with 20260210100000...

-- Orders
DROP POLICY IF EXISTS "Store members can view orders" ON public.orders; -- My previous migration recreates this, so safe to drop if duplicat
-- Actually, duplicate names handle themselves (drop if exists works). 
-- But check for any *other* names.
-- 20260202: "Store members can view orders" (Same name)
-- 20260202: "Store owners can manage orders"
-- My new migration handles owners in the "Store members..." policies via OR clause?
-- Let's keep "Store owners can manage orders" if it exists, it's fine.

-- Order Items
-- 20260202: "Store members can view order_items" (Underscore)
DROP POLICY IF EXISTS "Store members can view order_items" ON public.order_items;
-- 20260202: "Store owners can manage order_items"
DROP POLICY IF EXISTS "Store owners can manage order_items" ON public.order_items;

-- Products
-- 20260202: "Store members can view products"
-- 20260202: "Store owners can manage products"
-- These rely on is_store_member, so they should work now.

-- Ensure is_store_member is accessible
GRANT EXECUTE ON FUNCTION public.is_store_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_store_member(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_store_member(uuid, uuid) TO service_role;
