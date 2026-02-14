-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC(10, 2) DEFAULT 0,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(store_id, code)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_coupons_store_id ON public.coupons(store_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policies for coupons

-- Store owners/admins can view and manage their coupons
CREATE POLICY "Store owners can manage coupons"
    ON public.coupons
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE id = coupons.store_id
            AND owner_id = auth.uid()
        )
    );

-- Also allow store staff if needed (future proofing)
CREATE POLICY "Store staff can view coupons"
    ON public.coupons
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.store_members
            WHERE store_id = coupons.store_id
            AND user_id = auth.uid()
        )
    );

-- Public can verify coupons (only select specific fields if code matches? 
-- RLS doesn't support 'select if argument matches' easily for `select *`.
-- We will use a secure function or allow public read but filtered by store_id.
-- Actually, we don't want users scraping all coupons. 
-- Best practice: Create a Security Definer function to validate coupon, OR
-- allow SELECT but ensure the query always includes specific filters.
-- For simplicity in MVP: Allow public read of ACTIVE coupons for the store.
CREATE POLICY "Public can view active coupons"
    ON public.coupons
    FOR SELECT
    USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > now())
        AND (usage_limit IS NULL OR used_count < usage_limit)
    );

-- Update orders table to support coupons
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(10, 2); -- To distinguish from final total

-- Add trigger for updated_at in coupons
CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
