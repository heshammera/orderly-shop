-- Public catalog projection excludes merchant cost prices and inventory internals.
CREATE OR REPLACE VIEW public.public_products AS
 SELECT id,store_id,name,description,price,compare_at_price,sale_price,images,status,
 stock_quantity,track_inventory,ignore_stock,max_per_order,skip_cart,free_shipping,
 fake_countdown_enabled,fake_countdown_minutes,fake_visitors_enabled,fake_visitors_min,fake_visitors_max,
 metadata,created_at,updated_at
 FROM public.products WHERE status='active' AND public.is_public_store(store_id);
GRANT SELECT ON public.public_products TO anon,authenticated,service_role;
DROP POLICY IF EXISTS "Public active products" ON public.products;
DROP POLICY IF EXISTS "Public product category links" ON public.product_categories;
CREATE POLICY "Public product category links" ON public.product_categories FOR SELECT TO anon,authenticated
USING(EXISTS(SELECT 1 FROM public.public_products p WHERE p.id=product_id));
DROP POLICY IF EXISTS "Public active product variants" ON public.product_variants;
CREATE POLICY "Public active product variants" ON public.product_variants FOR SELECT TO anon,authenticated
USING(EXISTS(SELECT 1 FROM public.public_products p WHERE p.id=product_id));
DROP POLICY IF EXISTS "Public can view variant options" ON public.variant_options;
CREATE POLICY "Public catalog variant options" ON public.variant_options FOR SELECT TO anon,authenticated
USING(EXISTS(SELECT 1 FROM public.product_variants v JOIN public.public_products p ON p.id=v.product_id WHERE v.id=variant_id));
-- Stored JSON should be objects/arrays, not strings containing JSON.
CREATE OR REPLACE FUNCTION public.normalize_catalog_json() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF jsonb_typeof(NEW.name)='string' THEN
   BEGIN NEW.name:=(NEW.name#>>'{}')::jsonb;
   EXCEPTION WHEN invalid_text_representation THEN NEW.name:=jsonb_build_object('ar',NEW.name#>>'{}','en',NEW.name#>>'{}'); END;
 END IF;
 IF jsonb_typeof(NEW.description)='string' THEN
   BEGIN NEW.description:=(NEW.description#>>'{}')::jsonb;
   EXCEPTION WHEN invalid_text_representation THEN NEW.description:=jsonb_build_object('ar',NEW.description#>>'{}','en',NEW.description#>>'{}'); END;
 END IF;
 IF TG_TABLE_NAME='products' THEN
  IF jsonb_typeof(NEW.images)='string' THEN
   BEGIN NEW.images:=(NEW.images#>>'{}')::jsonb;
   EXCEPTION WHEN invalid_text_representation THEN NEW.images:=jsonb_build_array(NEW.images#>>'{}'); END;
  END IF;
 END IF;
 RETURN NEW;
END;$$;
CREATE TRIGGER normalize_catalog_json BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.normalize_catalog_json();
CREATE TRIGGER normalize_catalog_json BEFORE INSERT OR UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.normalize_catalog_json();
UPDATE public.products SET name=name WHERE jsonb_typeof(name)='string' OR jsonb_typeof(description)='string' OR jsonb_typeof(images)='string';
UPDATE public.categories SET name=name WHERE jsonb_typeof(name)='string' OR jsonb_typeof(description)='string';
NOTIFY pgrst,'reload schema';
