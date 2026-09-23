BEGIN;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variant_revision integer NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION public.get_product_variant_editor(p_product_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM products p WHERE p.id=p_product_id AND is_store_member(auth.uid(),p.store_id)) THEN RAISE EXCEPTION 'غير مصرح بإدارة هذا المنتج'; END IF;
 SELECT jsonb_build_object('revision',p.variant_revision,'variants',coalesce((SELECT jsonb_agg(to_jsonb(v)||jsonb_build_object('variant_options',coalesce((SELECT jsonb_agg(to_jsonb(o) ORDER BY o.sort_order,o.id) FROM variant_options o WHERE o.variant_id=v.id),'[]'::jsonb)) ORDER BY v.sort_order,v.id) FROM product_variants v WHERE v.product_id=p.id),'[]'::jsonb)) INTO result FROM products p WHERE p.id=p_product_id;
 RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.save_product_variant_editor(p_product_id uuid,p_variants jsonb,p_expected_revision integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target products; g jsonb; o jsonb; gi bigint; oi bigint; gid uuid; oid uuid; kept_groups uuid[]:='{}'; kept_options uuid[]; next_revision integer; previous_guard text;
BEGIN
 SELECT * INTO target FROM products WHERE id=p_product_id FOR UPDATE;
 IF NOT FOUND OR is_store_member(auth.uid(),target.store_id) IS NOT TRUE THEN RAISE EXCEPTION 'غير مصرح بإدارة هذا المنتج'; END IF;
 IF p_expected_revision IS NULL OR target.variant_revision<>p_expected_revision THEN RAISE EXCEPTION 'عُدلت الخيارات من جلسة أخرى. أعد تحميل المنتج قبل الحفظ.'; END IF;
 IF p_variants IS NULL OR jsonb_typeof(p_variants)<>'array' OR jsonb_array_length(p_variants)>30 OR octet_length(p_variants::text)>1000000 THEN RAISE EXCEPTION 'بيانات الخيارات غير صالحة أو تتجاوز الحد المسموح'; END IF;
 previous_guard:=current_setting('orderly.variant_editor_product',true);
 PERFORM set_config('orderly.variant_editor_product',p_product_id::text,true);
 FOR g,gi IN SELECT value,ordinality FROM jsonb_array_elements(p_variants) WITH ORDINALITY LOOP
  IF coalesce(trim(g->'name'->>'ar'),'')='' AND coalesce(trim(g->'name'->>'en'),'')='' THEN RAISE EXCEPTION 'اكتب اسم مجموعة الخيارات رقم %',gi; END IF;
  IF coalesce(g->>'display_type','') NOT IN ('buttons','list','dropdown','color','image') OR coalesce(g->>'option_type','') NOT IN ('text','color','image') THEN RAISE EXCEPTION 'طريقة عرض الخيارات غير صالحة'; END IF;
  IF jsonb_typeof(g->'options') IS DISTINCT FROM 'array' OR jsonb_array_length(g->'options') NOT BETWEEN 1 AND 300 THEN RAISE EXCEPTION 'قائمة الخيارات غير صالحة'; END IF;
  gid:=nullif(g->>'id','')::uuid;
  IF gid IS NOT NULL THEN
   IF NOT EXISTS(SELECT 1 FROM product_variants WHERE id=gid AND product_id=p_product_id) OR gid=ANY(kept_groups) THEN RAISE EXCEPTION 'تعارض في مجموعة الخيارات. أعد تحميل المنتج.'; END IF;
   UPDATE product_variants SET name=g->'name',display_type=g->>'display_type',option_type=g->>'option_type',required=coalesce((g->>'required')::boolean,false),sort_order=gi-1,updated_at=now() WHERE id=gid;
  ELSE
   INSERT INTO product_variants(product_id,name,display_type,option_type,required,sort_order) VALUES(p_product_id,g->'name',g->>'display_type',g->>'option_type',coalesce((g->>'required')::boolean,false),gi-1) RETURNING id INTO gid;
  END IF;
  kept_groups:=array_append(kept_groups,gid);kept_options:='{}';
  FOR o,oi IN SELECT value,ordinality FROM jsonb_array_elements(g->'options') WITH ORDINALITY LOOP
   IF coalesce(trim(o->'label'->>'ar'),'')='' AND coalesce(trim(o->'label'->>'en'),'')='' THEN RAISE EXCEPTION 'اكتب اسم الخيار % في المجموعة %',oi,gi; END IF;
   IF (o->>'price')::numeric<0 OR (o->>'stock')::integer<0 OR (o->>'stock_quantity')::integer<0 THEN RAISE EXCEPTION 'السعر والمخزون يجب أن يكونا صفرًا أو أكبر'; END IF;
   IF lower(coalesce(o->>'price','')) IN ('nan','infinity','-infinity') OR lower(coalesce(o->>'price_modifier','')) IN ('nan','infinity','-infinity') THEN RAISE EXCEPTION 'السعر يجب أن يكون رقمًا محدودًا'; END IF;
   oid:=nullif(o->>'id','')::uuid;
   IF oid IS NOT NULL THEN
    IF NOT EXISTS(SELECT 1 FROM variant_options WHERE id=oid AND variant_id=gid) OR oid=ANY(kept_options) THEN RAISE EXCEPTION 'الخيار لا ينتمي إلى هذه المجموعة أو تغير منذ فتح المنتج'; END IF;
    UPDATE variant_options SET label=o->'label',value=coalesce(o->>'value',''),price=(o->>'price')::numeric,
     price_modifier=CASE WHEN o ? 'price_modifier' THEN (o->>'price_modifier')::numeric ELSE price_modifier END,
     stock=(o->>'stock')::integer,stock_quantity=CASE WHEN o ? 'stock_quantity' THEN (o->>'stock_quantity')::integer ELSE stock_quantity END,
     manage_stock=coalesce((o->>'manage_stock')::boolean,true),in_stock=coalesce((o->>'in_stock')::boolean,true),is_default=coalesce((o->>'is_default')::boolean,false),sort_order=oi-1 WHERE id=oid;
   ELSE
    INSERT INTO variant_options(variant_id,label,value,price,price_modifier,stock,stock_quantity,manage_stock,in_stock,is_default,sort_order)
    VALUES(gid,o->'label',coalesce(o->>'value',''),(o->>'price')::numeric,coalesce((o->>'price_modifier')::numeric,0),(o->>'stock')::integer,(o->>'stock_quantity')::integer,coalesce((o->>'manage_stock')::boolean,true),coalesce((o->>'in_stock')::boolean,true),coalesce((o->>'is_default')::boolean,false),oi-1) RETURNING id INTO oid;
   END IF;
   kept_options:=array_append(kept_options,oid);
  END LOOP;
  DELETE FROM variant_options WHERE variant_id=gid AND NOT(id=ANY(kept_options));
 END LOOP;
 DELETE FROM product_variants WHERE product_id=p_product_id AND NOT(id=ANY(kept_groups));
 UPDATE products SET variant_revision=variant_revision+1 WHERE id=p_product_id RETURNING variant_revision INTO next_revision;
 PERFORM set_config('orderly.variant_editor_product',coalesce(previous_guard,''),true);
 RETURN jsonb_build_object('revision',next_revision);
END $$;
REVOKE ALL ON FUNCTION public.get_product_variant_editor(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.save_product_variant_editor(uuid,jsonb,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_product_variant_editor(uuid),public.save_product_variant_editor(uuid,jsonb,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.bump_product_variant_revision() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE pid uuid; vid uuid;
BEGIN
 IF TG_TABLE_NAME='product_variants' THEN pid:=CASE WHEN TG_OP='DELETE' THEN OLD.product_id ELSE NEW.product_id END;
 ELSE vid:=CASE WHEN TG_OP='DELETE' THEN OLD.variant_id ELSE NEW.variant_id END; SELECT product_id INTO pid FROM product_variants WHERE id=vid; END IF;
 IF pid IS NOT NULL AND current_setting('orderly.variant_editor_product',true) IS DISTINCT FROM pid::text THEN
  UPDATE products SET variant_revision=variant_revision+1 WHERE id=pid;
 END IF;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.bump_product_variant_revision() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS variant_revision_changed ON public.product_variants;
CREATE TRIGGER variant_revision_changed AFTER INSERT OR UPDATE OR DELETE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.bump_product_variant_revision();
DROP TRIGGER IF EXISTS option_revision_changed ON public.variant_options;
CREATE TRIGGER option_revision_changed AFTER INSERT OR UPDATE OR DELETE ON public.variant_options FOR EACH ROW EXECUTE FUNCTION public.bump_product_variant_revision();
NOTIFY pgrst,'reload schema';
COMMIT;
