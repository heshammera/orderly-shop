
-- 1. Add missing period columns to store_subscriptions table
ALTER TABLE public.store_subscriptions 
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- 2. Populate new columns for existing subscriptions
-- Defaulting to: Start = starts_at, End = starts_at + 1 month
UPDATE public.store_subscriptions
SET 
    current_period_start = starts_at,
    current_period_end = starts_at + interval '1 month'
WHERE current_period_start IS NULL;

-- 3. Verify store_visits table (ensure it exists for analytics)
CREATE TABLE IF NOT EXISTS public.store_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    visitor_id TEXT,
    page_path TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for store_visits
ALTER TABLE public.store_visits ENABLE ROW LEVEL SECURITY;

-- 4. Re-apply policies for store_visits just in case
DROP POLICY IF EXISTS "Store owners can view their store visits" ON public.store_visits;
CREATE POLICY "Store owners can view their store visits"
ON public.store_visits FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = store_visits.store_id
        AND stores.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Public can insert visits" ON public.store_visits;
CREATE POLICY "Public can insert visits"
ON public.store_visits FOR INSERT TO anon, authenticated
WITH CHECK (true);
