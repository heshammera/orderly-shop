ALTER TABLE themes
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Update the newly added themes with their metadata
UPDATE themes SET description = 'ثيم مثالي لمتاجر الملابس والأزياء والموضة.', thumbnail_url = '/themes_thumbnails/elegance.png' WHERE folder_name = 'elegance';
UPDATE themes SET description = 'تصميم عصري وجذاب لمتاجر الإلكترونيات والهواتف الذكية.', thumbnail_url = '/themes_thumbnails/technova.png' WHERE folder_name = 'technova';
UPDATE themes SET description = 'ديكورات وأثاث منزلي بلمسة دافئة ومريحة.', thumbnail_url = '/themes_thumbnails/cozyhome.png' WHERE folder_name = 'cozyhome';
UPDATE themes SET description = 'المكان الأنسب لبيع المجوهرات، العطور، والماركات الفاخرة.', thumbnail_url = '/themes_thumbnails/luxe.png' WHERE folder_name = 'luxe';
UPDATE themes SET description = 'مستحضرات تجميل وعناية بالبشرة بتصميم يبرز الجمال.', thumbnail_url = '/themes_thumbnails/glow.png' WHERE folder_name = 'glow';
UPDATE themes SET description = 'معدات رياضية وملابس طاقة وحركة.', thumbnail_url = '/themes_thumbnails/activeplus.png' WHERE folder_name = 'activeplus';
UPDATE themes SET description = 'بقالة إلكترونية، فواكه، ومنتجات صحية ومأكولات.', thumbnail_url = '/themes_thumbnails/freshcart.png' WHERE folder_name = 'freshcart';
UPDATE themes SET description = 'ألعاب، دمى، وكل ما يخطف قلب طفلك.', thumbnail_url = '/themes_thumbnails/kidswonder.png' WHERE folder_name = 'kidswonder';
