-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Store owners can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Store owners can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Store owners can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  auth.uid() IS NOT NULL
);

-- Product variants table (e.g., Color, Size)
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name JSONB NOT NULL DEFAULT '{"ar": "", "en": ""}',
  display_type TEXT NOT NULL DEFAULT 'buttons', -- buttons, list, dropdown, color, image
  option_type TEXT NOT NULL DEFAULT 'text', -- text, color, image
  sort_order INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Variant options (e.g., Red, Blue, XL, L)
CREATE TABLE public.variant_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  label JSONB NOT NULL DEFAULT '{"ar": "", "en": ""}',
  value TEXT NOT NULL, -- hex color, image url, or text value
  price_modifier NUMERIC DEFAULT 0, -- additional price for this option
  stock_quantity INTEGER DEFAULT NULL, -- optional separate stock per option
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Upsell offers (quantity-based pricing)
CREATE TABLE public.upsell_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  min_quantity INTEGER NOT NULL DEFAULT 2,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- percentage, fixed
  discount_value NUMERIC NOT NULL DEFAULT 0,
  label JSONB DEFAULT '{"ar": "", "en": ""}', -- e.g., "Buy 2 save 10%"
  badge JSONB DEFAULT '{"ar": "", "en": ""}', -- e.g., "Popular", "Best Value"
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_offers ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_variants
CREATE POLICY "Store members can view product variants"
ON public.product_variants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_variants.product_id
    AND is_store_member(auth.uid(), products.store_id)
  )
);

CREATE POLICY "Store owners can manage product variants"
ON public.product_variants FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM products
    JOIN stores ON stores.id = products.store_id
    WHERE products.id = product_variants.product_id
    AND stores.owner_id = auth.uid()
  )
);

-- RLS policies for variant_options
CREATE POLICY "Store members can view variant options"
ON public.variant_options FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM product_variants
    JOIN products ON products.id = product_variants.product_id
    WHERE product_variants.id = variant_options.variant_id
    AND is_store_member(auth.uid(), products.store_id)
  )
);

CREATE POLICY "Store owners can manage variant options"
ON public.variant_options FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM product_variants
    JOIN products ON products.id = product_variants.product_id
    JOIN stores ON stores.id = products.store_id
    WHERE product_variants.id = variant_options.variant_id
    AND stores.owner_id = auth.uid()
  )
);

-- RLS policies for upsell_offers
CREATE POLICY "Store members can view upsell offers"
ON public.upsell_offers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = upsell_offers.product_id
    AND is_store_member(auth.uid(), products.store_id)
  )
);

CREATE POLICY "Store owners can manage upsell offers"
ON public.upsell_offers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM products
    JOIN stores ON stores.id = products.store_id
    WHERE products.id = upsell_offers.product_id
    AND stores.owner_id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_variant_options_variant_id ON public.variant_options(variant_id);
CREATE INDEX idx_upsell_offers_product_id ON public.upsell_offers(product_id);

-- Updated_at triggers
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_upsell_offers_updated_at
  BEFORE UPDATE ON public.upsell_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();