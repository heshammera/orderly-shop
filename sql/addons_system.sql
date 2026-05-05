-- ==========================================
-- 1. جدول الخدمات الإضافية المتاحة (Add-ons Dictionary)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.add_ons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id TEXT NOT NULL REFERENCES public.plan_features(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(feature_id)
);

-- ==========================================
-- 2. جدول الخدمات المشتراة من قبل المتاجر (Store Ownership)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.store_add_ons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    add_on_id UUID NOT NULL REFERENCES public.add_ons(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'revoked'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(store_id, add_on_id) -- منع تكرار نفس الخدمة لنفس المتجر
);

-- ==========================================
-- 3. تحديث جدول طلبات الاشتراك لدعم الخدمات الإضافية
-- ==========================================
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='subscription_requests' AND COLUMN_NAME='add_on_id') THEN
        ALTER TABLE public.subscription_requests ADD COLUMN add_on_id UUID REFERENCES public.add_ons(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ==========================================
-- 4. دالة متطورة لجلب مميزات المتجر (باقة + إضافات)
-- ==========================================
CREATE OR REPLACE FUNCTION get_store_full_features(p_store_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_plan_features JSONB;
    v_addon_features JSONB;
    v_result JSONB;
BEGIN
    -- أ. جلب مميزات الباقة الحالية
    SELECT COALESCE(pl.features, '{}'::jsonb) INTO v_plan_features
    FROM plans pl
    JOIN store_subscriptions ss ON ss.plan_id = pl.id
    WHERE ss.store_id = p_store_id AND ss.status = 'active'
    LIMIT 1;

    -- ب. جلب المميزات من الخدمات الإضافية المشتراة
    SELECT jsonb_object_agg(ao.feature_id, true) INTO v_addon_features
    FROM store_add_ons sao
    JOIN add_ons ao ON ao.id = sao.add_on_id
    WHERE sao.store_id = p_store_id AND sao.status = 'active';

    -- ج. دمج المميزات (إضافات المتجر لها أولوية أو تضاف للباقة)
    v_result := COALESCE(v_plan_features, '{}'::jsonb) || COALESCE(v_addon_features, '{}'::jsonb);

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. تفعيل قواعد الحماية (RLS)
-- ==========================================
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_add_ons ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إذا وجدت لتجنب الأخطاء
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.add_ons;
DROP POLICY IF EXISTS "Allow read for store members" ON public.store_add_ons;

-- السماح للجميع (المسجلين) برؤية الخدمات المتاحة
CREATE POLICY "Allow read for authenticated users" ON public.add_ons FOR SELECT TO authenticated USING (is_active = true);

-- السماح لصاحب المتجر فقط برؤية الخدمات التي اشتراها
CREATE POLICY "Allow read for store members" ON public.store_add_ons FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM store_members WHERE store_id = store_add_ons.store_id AND user_id = auth.uid()));

-- ==========================================
-- 6. دالة الموافقة على طلب الخدمة الإضافية
-- ==========================================
CREATE OR REPLACE FUNCTION approve_add_on_request(p_request_id UUID)
RETURNS VOID AS $$
DECLARE
    v_store_id UUID;
    v_add_on_id UUID;
BEGIN
    -- 1. جلب بيانات الطلب
    SELECT store_id, add_on_id INTO v_store_id, v_add_on_id
    FROM subscription_requests
    WHERE id = p_request_id AND status = 'pending';

    IF v_store_id IS NULL OR v_add_on_id IS NULL THEN
        RAISE EXCEPTION 'Request not found or not an add-on request';
    END IF;

    -- 2. تفعيل الخدمة للمتجر
    INSERT INTO store_add_ons (store_id, add_on_id, status)
    VALUES (v_store_id, v_add_on_id, 'active')
    ON CONFLICT (store_id, add_on_id) DO UPDATE SET status = 'active';

    -- 3. تحديث حالة الطلب
    UPDATE subscription_requests
    SET status = 'approved'
    WHERE id = p_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
