-- SQL Script to create the required tables for Notifications, Reviews, and Abandoned Carts

-- ==========================================
-- 1. Notifications Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('order', 'stock', 'system', 'review', 'customer')),
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own store's notifications" 
ON public.notifications FOR SELECT 
USING (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "Users can insert their own store's notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "Users can update their own store's notifications" 
ON public.notifications FOR UPDATE 
USING (public.is_store_member(auth.uid(), store_id));

-- ==========================================
-- 2. Product Reviews Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies for product_reviews
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved reviews
CREATE POLICY "Anyone can view approved reviews" 
ON public.product_reviews FOR SELECT 
USING (status = 'approved');

-- Store owners can read all reviews for their store
CREATE POLICY "Store owners can view all reviews for their store" 
ON public.product_reviews FOR SELECT 
USING (public.is_store_member(auth.uid(), store_id));

-- Anyone can insert a review (moderated later by store owner)
CREATE POLICY "Anyone can insert a review" 
ON public.product_reviews FOR INSERT 
WITH CHECK (true);

-- Store owners can update reviews (approve/reject)
CREATE POLICY "Store owners can update reviews" 
ON public.product_reviews FOR UPDATE 
USING (public.is_store_member(auth.uid(), store_id));

-- Store owners can delete reviews
CREATE POLICY "Store owners can delete reviews" 
ON public.product_reviews FOR DELETE 
USING (public.is_store_member(auth.uid(), store_id));

-- ==========================================
-- 3. Abandoned Carts Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    recovery_status TEXT NOT NULL DEFAULT 'pending' CHECK (recovery_status IN ('pending', 'recovered', 'lost')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create updated_at trigger for abandoned_carts
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- We use DO to catch if trigger already exists from previous partial run
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_abandoned_carts_modtime'
    ) THEN
        CREATE TRIGGER update_abandoned_carts_modtime
            BEFORE UPDATE ON public.abandoned_carts
            FOR EACH ROW
            EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;


-- RLS Policies for abandoned_carts
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own store's abandoned carts" 
ON public.abandoned_carts FOR SELECT 
USING (public.is_store_member(auth.uid(), store_id));

-- Anyone can insert an abandoned cart (from checkout page)
CREATE POLICY "Anyone can insert an abandoned cart" 
ON public.abandoned_carts FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own store's abandoned carts" 
ON public.abandoned_carts FOR UPDATE 
USING (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "Users can delete their own store's abandoned carts" 
ON public.abandoned_carts FOR DELETE 
USING (public.is_store_member(auth.uid(), store_id));

-- ==========================================
-- Add Indexing for Performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_notifications_store_id ON public.notifications(store_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_store_id ON public.product_reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_store_id ON public.abandoned_carts(store_id);
