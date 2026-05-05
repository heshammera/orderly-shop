-- 1. التأكد من وجود الميزات في قاموس المنصة
INSERT INTO public.plan_features (id, name_ar, name_en, type, "group") VALUES
('ai_features', 'مميزات الذكاء الاصطناعي', 'AI Features', 'boolean', 'ai'),
('landing_pages', 'صفحات الهبوط المخصصة', 'Custom Landing Pages', 'boolean', 'marketing'),
('remove_branding', 'إزالة حقوق المنصة', 'Remove Branding', 'boolean', 'customization'),
('custom_domain', 'نطاق مخصص', 'Custom Domain', 'boolean', 'customization'),
('analytics', 'تحليلات متقدمة', 'Advanced Analytics', 'boolean', 'marketing')
ON CONFLICT (id) DO NOTHING;

-- 2. حقن الخدمات الإضافية بأسعار الدولار (add_ons)

-- ميزة الذكاء الاصطناعي
INSERT INTO public.add_ons (feature_id, name_ar, name_en, description_ar, description_en, price, is_active)
VALUES (
    'ai_features', 'مركز الذكاء الاصطناعي', 'AI Hub', 
    'استخدام الذكاء الاصطناعي في كتابة وصف المنتجات وتحسين المتجر مدى الحياة.', 
    'Use AI for product descriptions and store optimization forever.', 
    10.00, true
) ON CONFLICT (feature_id) DO UPDATE SET price = 10.00;

-- صفحات الهبوط
INSERT INTO public.add_ons (feature_id, name_ar, name_en, description_ar, description_en, price, is_active)
VALUES (
    'landing_pages', 'استوديو صفحات الهبوط', 'Landing Page Studio', 
    'إنشاء صفحات هبوط احترافية ومستقلة لكل منتج لزيادة المبيعات.', 
    'Create professional standalone landing pages for each product to boost sales.', 
    8.00, true
) ON CONFLICT (feature_id) DO UPDATE SET price = 8.00;

-- إزالة الحقوق
INSERT INTO public.add_ons (feature_id, name_ar, name_en, description_ar, description_en, price, is_active)
VALUES (
    'remove_branding', 'إزالة حقوق المنصة', 'White Label', 
    'إزالة عبارة "Powered by Orderly" من أسفل المتجر لإظهار علامتك التجارية فقط.', 
    'Remove "Powered by Orderly" from your store footer.', 
    6.00, true
) ON CONFLICT (feature_id) DO UPDATE SET price = 6.00;

-- الدومين المخصص
INSERT INTO public.add_ons (feature_id, name_ar, name_en, description_ar, description_en, price, is_active)
VALUES (
    'custom_domain', 'ربط دومين مخصص', 'Custom Domain', 
    'إمكانية ربط متجرك بنطاق خاص (مثل .com) لتعزيز موثوقية متجرك.', 
    'Connect your store to a custom domain (like .com).', 
    4.00, true
) ON CONFLICT (feature_id) DO UPDATE SET price = 4.00;

-- التحليلات المتقدمة
INSERT INTO public.add_ons (feature_id, name_ar, name_en, description_ar, description_en, price, is_active)
VALUES (
    'analytics', 'نظام التحليلات المتقدم', 'Advanced Analytics', 
    'تقارير تفصيلية عن سلوك الزوار ومصادر الزيارات ومعدلات التحويل.', 
    'Detailed reports on visitor behavior and conversion rates.', 
    5.00, true
) ON CONFLICT (feature_id) DO UPDATE SET price = 5.00;
