BEGIN;
INSERT INTO public.themes(name,folder_name,thumbnail_url) VALUES
('Elegance','elegance','/themes_thumbnails/elegance.png'),
('TechNova','technova','/themes_thumbnails/technova.png'),
('CozyHome','cozyhome','/themes_thumbnails/cozyhome.png'),
('Luxe','luxe','/themes_thumbnails/luxe.png'),
('Glow','glow','/themes_thumbnails/glow.png'),
('ActivePlus','activeplus','/themes_thumbnails/activeplus.png'),
('FreshCart','freshcart','/themes_thumbnails/freshcart.png'),
('KidsWonder','kidswonder','/themes_thumbnails/kidswonder.png')
ON CONFLICT(folder_name) DO NOTHING;
INSERT INTO public.theme_versions(theme_id,version,is_deprecated)
SELECT id,'1.0.0',false FROM public.themes WHERE folder_name IN ('elegance','technova','cozyhome','luxe','glow','activeplus','freshcart','kidswonder')
ON CONFLICT(theme_id,version) DO NOTHING;
COMMIT;
