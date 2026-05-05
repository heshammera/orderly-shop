-- إضافة ميزة "الذكاء الاصطناعي" كخدمة إضافية متاحة للشراء
-- يمكنك تعديل السعر من لوحة التحكم لاحقاً
INSERT INTO public.add_ons (feature_id, name_ar, name_en, description_ar, description_en, price, is_active)
VALUES (
    'ai_features', 
    'مميزات الذكاء الاصطناعي', 
    'AI Hub Features', 
    'تفعيل أدوات الذكاء الاصطناعي لوصف المنتجات وتحسين المتجر مدى الحياة.', 
    'Unlock AI tools for product descriptions and store optimization forever.', 
    500.00, 
    true
)
ON CONFLICT DO NOTHING;
