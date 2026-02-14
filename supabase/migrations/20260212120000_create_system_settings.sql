-- Create system_settings table for storing application configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write system settings
CREATE POLICY "Admins can manage system settings"
    ON public.system_settings FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to get a setting value
CREATE OR REPLACE FUNCTION public.get_setting(setting_key TEXT)
RETURNS JSONB AS $$
DECLARE
    setting_value JSONB;
BEGIN
    SELECT value INTO setting_value 
    FROM public.system_settings 
    WHERE key = setting_key;
    
    RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to set a setting value
CREATE OR REPLACE FUNCTION public.set_setting(setting_key TEXT, setting_value JSONB, setting_description TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
    INSERT INTO public.system_settings (key, value, description)
    VALUES (setting_key, setting_value, setting_description)
    ON CONFLICT (key) 
    DO UPDATE SET 
        value = setting_value,
        description = COALESCE(setting_description, system_settings.description),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default payment wallet configuration
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'payment_wallets',
    '{
        "wallets": [
            {
                "id": "1",
                "number": "+201003705046",
                "name": "Primary Wallet",
                "name_ar": "المحفظة الأساسية",
                "active": true
            }
        ]
    }'::jsonb,
    'Payment wallet numbers for manual recharge'
)
ON CONFLICT (key) DO NOTHING;

-- Create index
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);
