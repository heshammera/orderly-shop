BEGIN;
DROP POLICY IF EXISTS "Public can view product variants" ON public.product_variants;
COMMIT;
