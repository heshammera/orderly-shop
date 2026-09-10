BEGIN;
ALTER TABLE public.product_landing_pages DROP CONSTRAINT IF EXISTS product_landing_pages_template_check;
ALTER TABLE public.product_landing_pages ADD CONSTRAINT product_landing_pages_template_check CHECK(template IN ('hype','elegant','trust','noir','cyber','flash','modern'));
COMMIT;
