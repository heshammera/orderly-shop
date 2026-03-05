-- ============================================
-- Low Balance Alerts System
-- ============================================

-- 1. Create the low_balance_alerts table to track sent alerts
CREATE TABLE IF NOT EXISTS public.low_balance_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    balance_at_alert DECIMAL(12,2) NOT NULL,
    whatsapp_sent BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_low_balance_alerts_store_id ON public.low_balance_alerts(store_id);
CREATE INDEX idx_low_balance_alerts_created_at ON public.low_balance_alerts(created_at);

-- RLS
ALTER TABLE public.low_balance_alerts ENABLE ROW LEVEL SECURITY;

-- Store owners can view their own alerts
CREATE POLICY "Store owners can view their own alerts"
    ON public.low_balance_alerts FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = low_balance_alerts.store_id 
        AND stores.owner_id = auth.uid()
    ));

-- Service role handles inserts via RPC/API
CREATE POLICY "Service role full access on low_balance_alerts"
    ON public.low_balance_alerts FOR ALL
    USING (auth.role() = 'service_role');


-- 2. Create RPC to get stores needing low balance alert
-- Excludes stores that have unlimited balance
-- Excludes stores that have been alerted in the last 48 hours
-- Balance threshold is conceptually $2 USD, but balance is stored in local currency
-- So we check if (balance / exchange_rate) < 2
CREATE OR REPLACE FUNCTION public.get_stores_needing_low_balance_alert()
RETURNS TABLE (
    store_id UUID,
    store_name JSONB,
    balance DECIMAL(12,2),
    currency TEXT,
    owner_email TEXT,
    owner_phone TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id AS store_id,
        s.name AS store_name,
        s.balance AS balance,
        s.currency AS currency,
        u.email::TEXT AS owner_email,
        u.phone::TEXT AS owner_phone
    FROM 
        public.stores s
    JOIN 
        auth.users u ON u.id = s.owner_id
    WHERE 
        s.has_unlimited_balance = false AND
        (s.balance / COALESCE((SELECT rate FROM public.exchange_rates WHERE to_currency = s.currency ORDER BY created_at DESC LIMIT 1), 1)) < 2.00 AND
        NOT EXISTS (
            SELECT 1 
            FROM public.low_balance_alerts lba 
            WHERE lba.store_id = s.id 
            AND lba.created_at > now() - interval '48 hours'
        );
END;
$$;
