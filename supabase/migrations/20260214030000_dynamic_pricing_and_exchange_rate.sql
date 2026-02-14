-- Add display_features to plans table
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS display_features JSONB DEFAULT '{"ar": [], "en": []}'::jsonb;

-- Add exchange_rate_usd_egp to system_settings
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'exchange_rate_usd_egp',
    '{"rate": 50}'::jsonb,
    'Exchange rate for converting USD to EGP during payment'
)
ON CONFLICT (key) DO NOTHING;

-- Update existing plans with some default display features if they are empty
UPDATE public.plans 
SET display_features = '{"ar": ["ميزة 1", "ميزة 2"], "en": ["Feature 1", "Feature 2"]}'::jsonb
WHERE display_features = '{"ar": [], "en": []}'::jsonb OR display_features IS NULL;
