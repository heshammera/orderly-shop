-- 1. Create Plan Features Dictionary
CREATE TABLE IF NOT EXISTS plan_features (
    id TEXT PRIMARY KEY, -- e.g., 'max_products', 'custom_domain'
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    type TEXT NOT NULL CHECK (type IN ('boolean', 'integer', 'string')),
    "group" TEXT NOT NULL, -- e.g., 'products', 'marketing', 'customization'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Plan Feature Values Mapping
CREATE TABLE IF NOT EXISTS plan_feature_values (
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    feature_id TEXT NOT NULL REFERENCES plan_features(id) ON DELETE CASCADE,
    value TEXT NOT NULL, -- Stored as text, parsed based on feature 'type'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (plan_id, feature_id)
);

-- RLS for Plan Features
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_feature_values ENABLE ROW LEVEL SECURITY;

-- Plan features are public for reading (needed for storefront pricing page)
CREATE POLICY "Public read plan features" ON plan_features FOR SELECT USING (true);
CREATE POLICY "Public read plan feature values" ON plan_feature_values FOR SELECT USING (true);

-- Functions to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_plan_features_updated_at
    BEFORE UPDATE ON plan_features
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_feature_values_updated_at
BEFORE UPDATE ON plan_feature_values
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Seed initial basic features dictionary based on existing jsonb structure
INSERT INTO plan_features (id, name_en, name_ar, type, "group", description_en, description_ar) VALUES
('products_limit', 'Products Limit', 'حد المنتجات', 'integer', 'products', 'Maximum number of products allowed (-1 for unlimited)', 'الحد الأقصى لعدد المنتجات المسموح بها (-1 للامحدود)'),
('stores_limit', 'Stores Limit', 'حد المتاجر', 'integer', 'stores', 'Maximum number of stores a user can create', 'الحد الأقصى لعدد المتاجر التي يمكن للمستخدم إنشاؤها'),
('custom_domain', 'Custom Domain', 'نطاق مخصص', 'boolean', 'customization', 'Allow linking a custom domain', 'السماح بربط نطاق مخصص')
ON CONFLICT (id) DO NOTHING;

-- Seed initial values based on current plans
-- We need to fetch the plan ids dynamically
DO $$
DECLARE
    v_free_plan_id UUID;
    v_starter_plan_id UUID;
    v_pro_plan_id UUID;
    v_enterprise_plan_id UUID;
BEGIN
    SELECT id INTO v_free_plan_id FROM plans WHERE name_en = 'Free' LIMIT 1;
    SELECT id INTO v_starter_plan_id FROM plans WHERE name_en = 'Starter' LIMIT 1;
    SELECT id INTO v_pro_plan_id FROM plans WHERE name_en = 'Pro' LIMIT 1;
    SELECT id INTO v_enterprise_plan_id FROM plans WHERE name_en = 'Enterprise' LIMIT 1;

    -- Free Plan Values
    IF v_free_plan_id IS NOT NULL THEN
        INSERT INTO plan_feature_values (plan_id, feature_id, value) VALUES (v_free_plan_id, 'products_limit', '50') ON CONFLICT DO NOTHING;
        INSERT INTO plan_feature_values (plan_id, feature_id, value) VALUES (v_free_plan_id, 'stores_limit', '1') ON CONFLICT DO NOTHING;
        INSERT INTO plan_feature_values (plan_id, feature_id, value) VALUES (v_free_plan_id, 'custom_domain', 'false') ON CONFLICT DO NOTHING;
    END IF;

    -- Starter Plan Values
    IF v_starter_plan_id IS NOT NULL THEN
        INSERT INTO plan_feature_values (plan_id, feature_id, value) VALUES (v_starter_plan_id, 'products_limit', '500') ON CONFLICT DO NOTHING;
        INSERT INTO plan_feature_values (plan_id, feature_id, value) VALUES (v_starter_plan_id, 'stores_limit', '1') ON CONFLICT DO NOTHING;
        INSERT INTO plan_feature_values (plan_id, feature_id, value) VALUES (v_starter_plan_id, 'custom_domain', 'true') ON CONFLICT DO NOTHING;
    END IF;

    -- Pro Plan Values
    IF v_pro_plan_id IS NOT NULL THEN
        INSERT INTO plan_feature_values (plan_id, feature_id, value) VALUES (v_pro_plan_id, 'products_limit', '10000') ON CONFLICT DO NOTHING;
        INSERT INTO plan_feature_values (plan_id, feature_id, value) VALUES (v_pro_plan_id, 'stores_limit', '3') ON CONFLICT DO NOTHING;
        INSERT INTO plan_feature_values (plan_id, feature_id, value) VALUES (v_pro_plan_id, 'custom_domain', 'true') ON CONFLICT DO NOTHING;
    END IF;

    -- Enterprise Plan Values
    IF v_enterprise_plan_id IS NOT NULL THEN
        INSERT INTO plan_feature_values (plan_id, feature_id, value) VALUES (v_enterprise_plan_id, 'products_limit', '-1') ON CONFLICT DO NOTHING;
        INSERT INTO plan_feature_values (plan_id, feature_id, value) VALUES (v_enterprise_plan_id, 'stores_limit', '10') ON CONFLICT DO NOTHING;
        INSERT INTO plan_feature_values (plan_id, feature_id, value) VALUES (v_enterprise_plan_id, 'custom_domain', 'true') ON CONFLICT DO NOTHING;
    END IF;
END $$;
