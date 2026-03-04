-- Insert the base default theme
INSERT INTO themes (name, folder_name) 
VALUES ('البداية - The Beginning (Default)', 'default') 
ON CONFLICT DO NOTHING;

-- Insert its version 1.0.0
INSERT INTO theme_versions (theme_id, version, is_deprecated) 
SELECT id, '1.0.0', false FROM themes WHERE folder_name = 'default' 
ON CONFLICT DO NOTHING;
