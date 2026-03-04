-- Insert the 8 new themes into the themes table
INSERT INTO themes (name, folder_name, thumbnail_url, description) VALUES
('أناقة - Elegance', 'elegance', '/themes_thumbnails/elegance.png', 'ثيم مثالي لمتاجر الملابس والأزياء والموضة.'),
('تك نوفا - TechNova', 'technova', '/themes_thumbnails/technova.png', 'تصميم عصري وجذاب لمتاجر الإلكترونيات والهواتف الذكية.'),
('بيت دافئ - CozyHome', 'cozyhome', '/themes_thumbnails/cozyhome.png', 'ديكورات وأثاث منزلي بلمسة دافئة ومريحة.'),
('فخامة - Luxe', 'luxe', '/themes_thumbnails/luxe.png', 'المكان الأنسب لبيع المجوهرات، العطور، والماركات الفاخرة.'),
('إشراقة - Glow', 'glow', '/themes_thumbnails/glow.png', 'مستحضرات تجميل وعناية بالبشرة بتصميم يبرز الجمال.'),
('أكتيف - ActivePlus', 'activeplus', '/themes_thumbnails/activeplus.png', 'معدات رياضية وملابس طاقة وحركة.'),
('سلة طازجة - FreshCart', 'freshcart', '/themes_thumbnails/freshcart.png', 'بقالة إلكترونية، فواكه، ومنتجات صحية ومأكولات.'),
('عالم الطفل - KidsWonder', 'kidswonder', '/themes_thumbnails/kidswonder.png', 'ألعاب، دمى، وكل ما يخطف قلب طفلك.')
ON CONFLICT DO NOTHING;

-- Insert versions for the newly inserted themes
INSERT INTO theme_versions (theme_id, version, is_deprecated)
SELECT id, '1.0.0', false FROM themes 
WHERE folder_name IN ('elegance', 'technova', 'cozyhome', 'luxe', 'glow', 'activeplus', 'freshcart', 'kidswonder')
ON CONFLICT DO NOTHING;
