-- Create Plans Table
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name JSONB NOT NULL, -- {'ar': 'أساسي', 'en': 'Basic'}
    slug TEXT UNIQUE NOT NULL,
    description JSONB,
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    limits JSONB DEFAULT '{}'::jsonb, -- {'products': 50, ...}
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active plans" ON public.plans;
CREATE POLICY "Public can view active plans" ON public.plans FOR SELECT USING (is_active = true);

-- Create Subscription Status Enum
DO $$ BEGIN
    CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'incomplete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.plans(id),
    status public.subscription_status DEFAULT 'incomplete',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners can view their subscription" ON public.subscriptions;
CREATE POLICY "Store owners can view their subscription" ON public.subscriptions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.store_members WHERE store_id = subscriptions.store_id AND user_id = auth.uid())
);

-- Create Usage Records Table
CREATE TABLE IF NOT EXISTS public.usage_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    metric TEXT NOT NULL, -- 'products_count', 'orders_count_monthly'
    value INTEGER DEFAULT 0,
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(store_id, metric)
);

-- RLS for Usage Records
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners can view usage" ON public.usage_records;
CREATE POLICY "Store owners can view usage" ON public.usage_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.store_members WHERE store_id = usage_records.store_id AND user_id = auth.uid())
);

-- Seed Initial Plans
INSERT INTO public.plans (slug, name, description, price_monthly, limits, features) VALUES
(
    'basic', 
    '{"ar": "بداية", "en": "Basic"}', 
    '{"ar": "خطة مجانية للبدء", "en": "Free plan to get started"}',
    0, 
    '{"products": 20, "orders_monthly": 50}', 
    '["storefront", "basic_analytics"]'
),
(
    'pro', 
    '{"ar": "احترافي", "en": "Pro"}', 
    '{"ar": "للمتاجر النامية", "en": "For growing stores"}',
    29, 
    '{"products": 500, "orders_monthly": 1000}', 
    '["custom_domain", "advanced_analytics", "pixels"]'
),
(
    'enterprise', 
    '{"ar": "شركات", "en": "Enterprise"}', 
    '{"ar": "حلول متكاملة بلا حدود", "en": "Unlimited solutions"}',
    99, 
    '{"products": -1, "orders_monthly": -1}', 
    '["unlimited", "priority_support"]'
)
ON CONFLICT (slug) DO NOTHING;
