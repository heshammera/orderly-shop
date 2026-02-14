
-- Create store_visits table for analytics
CREATE TABLE IF NOT EXISTS public.store_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    visitor_id TEXT, -- Optional: for tracking unique visitors via cookie/fingerprint
    page_path TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address TEXT, -- Optional: Privacy concern, maybe hash it?
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_visits ENABLE ROW LEVEL SECURITY;

-- Policies
-- Store owners can view visits
CREATE POLICY "Store owners can view their store visits"
ON public.store_visits
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = store_visits.store_id
        AND stores.owner_id = auth.uid()
    )
);

-- Public can insert visits (anon key)
CREATE POLICY "Public can insert visits"
ON public.store_visits
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
