-- ============================================
-- FIX: Allow public read access to product variants,
-- variant options, and upsell offers for storefront display
-- ============================================

-- product_variants: Public can view
DROP POLICY IF EXISTS "Public can view product variants" ON public.product_variants;
CREATE POLICY "Public can view product variants" ON public.product_variants
FOR SELECT USING (true);

-- variant_options: Public can view
DROP POLICY IF EXISTS "Public can view variant options" ON public.variant_options;
CREATE POLICY "Public can view variant options" ON public.variant_options
FOR SELECT USING (true);

-- upsell_offers: Public can view active offers
DROP POLICY IF EXISTS "Public can view upsell offers" ON public.upsell_offers;
CREATE POLICY "Public can view upsell offers" ON public.upsell_offers
FOR SELECT USING (true);
