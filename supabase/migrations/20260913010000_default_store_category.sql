CREATE FUNCTION public.create_store_main_category() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 INSERT INTO public.categories(store_id,name,sort_order,status)
 VALUES(NEW.id,jsonb_build_object('ar','المنتجات الرئيسية','en','Main products'),0,'active');
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_store_main_category() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER store_main_category_after_insert AFTER INSERT ON public.stores
FOR EACH ROW EXECUTE FUNCTION public.create_store_main_category();
