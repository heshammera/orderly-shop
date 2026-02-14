-- Create store_visits table
CREATE TABLE IF NOT EXISTS public.store_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    visitor_id TEXT, -- formatted as session/cookie id
    page_url TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_store_visits_store_id ON public.store_visits(store_id);
CREATE INDEX IF NOT EXISTS idx_store_visits_created_at ON public.store_visits(created_at);

-- Add cost_price to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2) DEFAULT 0;

-- RLS for store_visits
ALTER TABLE public.store_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stores can view their own visits"
ON public.store_visits
FOR SELECT
USING (store_id IN (
    SELECT store_id FROM public.store_members WHERE user_id = auth.uid()
    UNION
    SELECT id FROM public.stores WHERE owner_id = auth.uid()
));

-- Open insertion for public (visitors)
CREATE POLICY "Anyone can insert visits"
ON public.store_visits
FOR INSERT
WITH CHECK (true);
