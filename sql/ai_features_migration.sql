-- Migration script to add AI features flag to plan_features table

-- 1. Insert the AI Features flag into the plan_features dictionary
INSERT INTO plan_features (id, name_ar, name_en, type, "group")
VALUES (
    'ai_features',
    'مميزات الذكاء الاصطناعي',
    'AI Features',
    'boolean',
    'ai'
)
ON CONFLICT (id) DO NOTHING;

-- Note: To enable this feature for existing plans, you can run an update like this:
-- UPDATE plans
-- SET features = features || '{"ai_features": true}'
-- WHERE slug = 'pro';
