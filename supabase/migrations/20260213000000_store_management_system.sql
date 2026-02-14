-- 1. Update Stores Table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS status_reason TEXT;
-- Ensure status column exists and is text (it should be based on previous schema)
-- We will use statuses: 'active', 'banned', 'maintenance', 'unpaid'

-- 2. Create Plans Table
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    interval TEXT NOT NULL CHECK (interval IN ('monthly', 'yearly', 'lifetime')),
    features JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Store Subscriptions Table
CREATE TABLE IF NOT EXISTS store_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'past_due')),
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_store_subscriptions_store_id ON store_subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_store_subscriptions_plan_id ON store_subscriptions(plan_id);

-- RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public read access to active plans
CREATE POLICY "Public read active plans" ON plans FOR SELECT USING (is_active = true);

-- Stores can read their own subscriptions
CREATE POLICY "Stores read own subscription" ON store_subscriptions 
FOR SELECT USING (store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid() 
    UNION 
    SELECT store_id FROM store_members WHERE user_id = auth.uid()
));

-- 4. Seed Initial Plans
INSERT INTO plans (name_en, name_ar, price, interval, features) VALUES
('Free', 'مجانية', 0, 'lifetime', '{"products_limit": 50, "stores_limit": 1}'),
('Starter', 'بداية', 99, 'monthly', '{"products_limit": 500, "stores_limit": 1}'),
('Pro', 'محترف', 299, 'monthly', '{"products_limit": 10000, "stores_limit": 3}'),
('Enterprise', 'شركات', 999, 'monthly', '{"products_limit": -1, "stores_limit": 10}')
ON CONFLICT DO NOTHING; -- No conflict constraint on name, but just in case we run this multiple times we might want to be careful. Ideally we check existence.

-- 5. RPC: Get Admin Dashboard Stats
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    v_total_stores INT;
    v_active_stores INT;
    v_banned_stores INT;
    v_total_users INT;
    v_total_revenue NUMERIC;
    v_pending_recharges INT;
BEGIN
    SELECT COUNT(*) INTO v_total_stores FROM stores;
    SELECT COUNT(*) INTO v_active_stores FROM stores WHERE status = 'active';
    SELECT COUNT(*) INTO v_banned_stores FROM stores WHERE status = 'banned';
    SELECT COUNT(*) INTO v_total_users FROM auth.users;
    
    -- Mock revenue calculation (sum of paid subscriptions + transaction fees)
    -- For now, let's just sum wallet recharges as "revenue" proxy or use 0
    SELECT COALESCE(SUM(amount), 0) INTO v_total_revenue FROM wallet_transactions WHERE type = 'deposit'; 
    
    SELECT COUNT(*) INTO v_pending_recharges FROM wallet_recharge_requests WHERE status = 'pending';

    RETURN json_build_object(
        'total_stores', v_total_stores,
        'active_stores', v_active_stores,
        'banned_stores', v_banned_stores,
        'total_users', v_total_users,
        'total_revenue', v_total_revenue,
        'pending_recharges', v_pending_recharges
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: Get All Stores Paginated (for Admin)
CREATE OR REPLACE FUNCTION get_all_stores_paginated(
    p_page INT DEFAULT 1,
    p_limit INT DEFAULT 10,
    p_search TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_offset INT;
    v_total_count INT;
    v_stores JSON;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    -- Get Total Count
    SELECT COUNT(*) INTO v_total_count
    FROM stores s
    LEFT JOIN profiles p ON s.owner_id = p.id
    WHERE (p_search IS NULL OR s.name::text ILIKE '%' || p_search || '%' OR s.slug ILIKE '%' || p_search || '%' OR p.email ILIKE '%' || p_search || '%')
      AND (p_status IS NULL OR p_status = 'all' OR s.status = p_status);

    -- Get Data
    SELECT json_agg(t) INTO v_stores
    FROM (
        SELECT 
            s.id,
            s.name,
            s.slug,
            s.status,
            s.status_reason,
            s.logo_url,
            s.created_at,
            s.balance,
            p.email as owner_email,
            p.full_name as owner_name,
            (SELECT name_ar FROM plans pl JOIN store_subscriptions ss ON ss.plan_id = pl.id WHERE ss.store_id = s.id AND ss.status = 'active' LIMIT 1) as plan_name
        FROM stores s
        LEFT JOIN profiles p ON s.owner_id = p.id
        WHERE (p_search IS NULL OR s.name::text ILIKE '%' || p_search || '%' OR s.slug ILIKE '%' || p_search || '%' OR p.email ILIKE '%' || p_search || '%')
          AND (p_status IS NULL OR p_status = 'all' OR s.status = p_status)
        ORDER BY s.created_at DESC
        LIMIT p_limit OFFSET v_offset
    ) t;

    RETURN json_build_object(
        'data', COALESCE(v_stores, '[]'::json),
        'total', v_total_count,
        'page', p_page,
        'limit', p_limit
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: Admin Update Store Status
CREATE OR REPLACE FUNCTION admin_update_store_status(
    p_store_id UUID,
    p_status TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    UPDATE stores
    SET 
        status = p_status,
        status_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_store_id;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
