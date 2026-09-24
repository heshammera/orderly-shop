BEGIN;

-- Visibility controls discovery only. Checkout and direct product links continue
-- to use status and stock, and public_products intentionally includes unlisted.
ALTER TABLE public.products ADD COLUMN catalog_visibility text NOT NULL DEFAULT 'listed'
  CHECK (catalog_visibility IN ('listed', 'unlisted'));
ALTER TABLE public.products ADD CONSTRAINT products_store_id_id_key UNIQUE (store_id, id);
CREATE INDEX products_catalog_discovery_idx ON public.products (store_id, created_at DESC, id)
  WHERE status = 'active' AND catalog_visibility = 'listed';

CREATE OR REPLACE VIEW public.public_products AS
 SELECT id,store_id,name,description,price,compare_at_price,sale_price,images,status,
 stock_quantity,track_inventory,ignore_stock,max_per_order,skip_cart,free_shipping,
 fake_countdown_enabled,fake_countdown_minutes,fake_visitors_enabled,fake_visitors_min,fake_visitors_max,
 metadata,created_at,updated_at,sku,catalog_visibility
 FROM public.products WHERE status='active' AND public.is_public_store(store_id);
CREATE VIEW public.public_catalog_products WITH (security_barrier=true) AS
 SELECT * FROM public.public_products WHERE catalog_visibility='listed';
GRANT SELECT ON public.public_products, public.public_catalog_products TO anon, authenticated, service_role;

CREATE TABLE public.product_merchandising (
 product_id uuid PRIMARY KEY,
 store_id uuid NOT NULL,
 revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
 mode text NOT NULL DEFAULT 'auto' CHECK (mode IN ('auto', 'manual', 'off')),
 title jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (
   jsonb_typeof(title)='object' AND title-'ar'-'en'='{}'::jsonb
   AND (NOT title ? 'ar' OR (jsonb_typeof(title->'ar')='string' AND length(title->>'ar')<=120))
   AND (NOT title ? 'en' OR (jsonb_typeof(title->'en')='string' AND length(title->>'en')<=120))
 ),
 display_limit integer NOT NULL DEFAULT 4 CHECK (display_limit IN (2,4,6,8)),
 updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (store_id,product_id) REFERENCES public.products(store_id,id) ON DELETE CASCADE
);
CREATE TABLE public.product_recommendations (
 product_id uuid NOT NULL,
 recommended_product_id uuid NOT NULL,
 store_id uuid NOT NULL,
 sort_order integer NOT NULL CHECK (sort_order BETWEEN 0 AND 7),
 PRIMARY KEY (product_id,recommended_product_id),
 UNIQUE (product_id,sort_order),
 CHECK (product_id<>recommended_product_id),
 FOREIGN KEY (store_id,product_id) REFERENCES public.products(store_id,id) ON DELETE CASCADE,
 FOREIGN KEY (store_id,recommended_product_id) REFERENCES public.products(store_id,id) ON DELETE CASCADE
);
CREATE INDEX product_recommendations_target_idx ON public.product_recommendations (recommended_product_id);
ALTER TABLE public.product_merchandising ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;
-- Editing is exclusively through revision-checked RPCs; even owners cannot
-- bypass the transaction by editing these tables directly through PostgREST.
REVOKE ALL ON public.product_merchandising, public.product_recommendations FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.product_merchandising, public.product_recommendations TO service_role;

CREATE FUNCTION public.bump_product_merchandising_visibility_revision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.catalog_visibility IS DISTINCT FROM OLD.catalog_visibility THEN
   INSERT INTO public.product_merchandising(product_id,store_id,revision)
   VALUES(NEW.id,NEW.store_id,1)
   ON CONFLICT(product_id) DO UPDATE SET revision=product_merchandising.revision+1,updated_at=now();
 END IF;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.bump_product_merchandising_visibility_revision() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER product_merchandising_visibility_revision
 AFTER UPDATE OF catalog_visibility ON public.products FOR EACH ROW
 EXECUTE FUNCTION public.bump_product_merchandising_visibility_revision();

CREATE FUNCTION public.get_product_merchandising(p_product_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.products p JOIN public.stores s ON s.id=p.store_id
   WHERE p.id=p_product_id AND s.owner_id=auth.uid()) THEN
   RAISE EXCEPTION 'غير مصرح بإدارة هذا المنتج' USING ERRCODE='42501';
 END IF;
 SELECT jsonb_build_object(
   'revision',coalesce(m.revision,0),'catalog_visibility',p.catalog_visibility,
   'mode',coalesce(m.mode,'auto'),'title',jsonb_build_object('ar',coalesce(m.title->>'ar',''),'en',coalesce(m.title->>'en','')),
   'display_limit',coalesce(m.display_limit,4),
   'recommendation_ids',coalesce((SELECT jsonb_agg(r.recommended_product_id ORDER BY r.sort_order)
     FROM public.product_recommendations r WHERE r.product_id=p.id),'[]'::jsonb)
 ) INTO result FROM public.products p LEFT JOIN public.product_merchandising m ON m.product_id=p.id
 WHERE p.id=p_product_id;
 RETURN result;
END $$;

CREATE FUNCTION public.save_product_merchandising(
 p_product_id uuid,p_revision integer,p_catalog_visibility text,p_mode text,
 p_title jsonb,p_display_limit integer,p_recommendation_ids uuid[]
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target public.products%ROWTYPE; current_revision integer;
BEGIN
 SELECT * INTO target FROM public.products WHERE id=p_product_id FOR NO KEY UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.stores WHERE id=target.store_id AND owner_id=auth.uid()) THEN
   RAISE EXCEPTION 'غير مصرح بإدارة هذا المنتج' USING ERRCODE='42501';
 END IF;
 SELECT coalesce((SELECT revision FROM public.product_merchandising WHERE product_id=p_product_id),0) INTO current_revision;
 IF p_revision IS NULL OR current_revision<>p_revision THEN
   -- PT409 is a user conflict, not a retryable transaction serialization failure.
   RAISE EXCEPTION 'عُدلت إعدادات المنتج من جلسة أخرى. أعد تحميل المنتج قبل الحفظ.' USING ERRCODE='PT409';
 END IF;
 IF p_catalog_visibility IS NULL OR p_catalog_visibility NOT IN ('listed','unlisted')
   OR p_mode IS NULL OR p_mode NOT IN ('auto','manual','off')
   OR p_display_limit IS NULL OR p_display_limit NOT IN (2,4,6,8)
   OR p_title IS NULL OR jsonb_typeof(p_title) IS DISTINCT FROM 'object'
   OR p_title-'ar'-'en'<>'{}'::jsonb
   OR (p_title ? 'ar' AND (jsonb_typeof(p_title->'ar') IS DISTINCT FROM 'string' OR length(p_title->>'ar')>120))
   OR (p_title ? 'en' AND (jsonb_typeof(p_title->'en') IS DISTINCT FROM 'string' OR length(p_title->>'en')>120)) THEN
   RAISE EXCEPTION 'إعدادات الظهور والاقتراحات غير صالحة' USING ERRCODE='22023';
 END IF;
 IF p_recommendation_ids IS NULL OR cardinality(p_recommendation_ids)>8
   OR EXISTS(SELECT 1 FROM unnest(p_recommendation_ids) AS x(id) WHERE id IS NULL OR id=p_product_id)
   OR (SELECT count(DISTINCT id) FROM unnest(p_recommendation_ids) AS x(id))<>cardinality(p_recommendation_ids)
   OR EXISTS(SELECT 1 FROM unnest(p_recommendation_ids) AS x(id)
     WHERE NOT EXISTS(SELECT 1 FROM public.products p WHERE p.id=x.id AND p.store_id=target.store_id)) THEN
   RAISE EXCEPTION 'اختر حتى 8 منتجات مختلفة من نفس المتجر دون المنتج الحالي' USING ERRCODE='22023';
 END IF;
 UPDATE public.products SET catalog_visibility=p_catalog_visibility WHERE id=p_product_id;
 -- The visibility trigger also covers direct/import updates; this RPC advances
 -- exactly once whether or not visibility changed alongside its other fields.
 INSERT INTO public.product_merchandising(product_id,store_id,revision,mode,title,display_limit)
 VALUES(p_product_id,target.store_id,current_revision+1,p_mode,p_title,p_display_limit)
 ON CONFLICT(product_id) DO UPDATE SET revision=current_revision+1,mode=excluded.mode,
   title=excluded.title,display_limit=excluded.display_limit,updated_at=now();
 DELETE FROM public.product_recommendations WHERE product_id=p_product_id;
 INSERT INTO public.product_recommendations(product_id,recommended_product_id,store_id,sort_order)
 SELECT p_product_id,x.id,target.store_id,(x.position-1)::integer
 FROM unnest(p_recommendation_ids) WITH ORDINALITY AS x(id,position);
 RETURN public.get_product_merchandising(p_product_id);
END $$;

CREATE FUNCTION public.set_product_visibility_bulk(p_store_id uuid,p_product_ids uuid[],p_visibility text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE matched integer; unchanged_ids uuid[];
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.stores WHERE id=p_store_id AND owner_id=auth.uid()) THEN
   RAISE EXCEPTION 'غير مصرح بإدارة منتجات هذا المتجر' USING ERRCODE='42501';
 END IF;
 IF p_visibility IS NULL OR p_visibility NOT IN ('listed','unlisted')
   OR p_product_ids IS NULL OR cardinality(p_product_ids) NOT BETWEEN 1 AND 200
   OR EXISTS(SELECT 1 FROM unnest(p_product_ids) AS x(id) WHERE id IS NULL)
   OR (SELECT count(DISTINCT id) FROM unnest(p_product_ids) AS x(id))<>cardinality(p_product_ids) THEN
   RAISE EXCEPTION 'اختر من 1 إلى 200 منتج مختلف وإعداد ظهور صالح' USING ERRCODE='22023';
 END IF;
 -- A deterministic lock order avoids deadlocks between overlapping bulk edits.
 PERFORM id FROM public.products WHERE store_id=p_store_id AND id=ANY(p_product_ids)
   ORDER BY id FOR NO KEY UPDATE;
 GET DIAGNOSTICS matched=ROW_COUNT;
 IF matched<>cardinality(p_product_ids) THEN
   RAISE EXCEPTION 'يجب أن تنتمي جميع المنتجات المختارة إلى المتجر' USING ERRCODE='22023';
 END IF;
 SELECT array_agg(id) INTO unchanged_ids FROM public.products
 WHERE store_id=p_store_id AND id=ANY(p_product_ids) AND catalog_visibility=p_visibility;
 UPDATE public.products SET catalog_visibility=p_visibility WHERE store_id=p_store_id AND id=ANY(p_product_ids);
 -- An explicit bulk action invalidates open editors even for unchanged values.
 INSERT INTO public.product_merchandising(product_id,store_id,revision)
 SELECT id,p_store_id,1 FROM unnest(unchanged_ids) AS x(id)
 ON CONFLICT(product_id) DO UPDATE SET revision=product_merchandising.revision+1,updated_at=now();
 RETURN jsonb_build_object('updated_count',matched,'catalog_visibility',p_visibility);
END $$;

-- One stock rule shared by public results and the owner's candidate picker.
-- Empty required groups remain unavailable even when inventory is ignored.
CREATE FUNCTION public.product_is_recommendable(p_product_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.products p WHERE p.id=p_product_id AND p.status='active'
   AND (p.max_per_order IS NULL OR p.max_per_order>=1)
   AND (coalesce(p.ignore_stock,false) OR NOT p.track_inventory OR p.stock_quantity>0)
   AND NOT EXISTS(SELECT 1 FROM public.product_variants v WHERE v.product_id=p.id AND v.required
     AND NOT EXISTS(SELECT 1 FROM public.variant_options o WHERE o.variant_id=v.id
       AND (coalesce(p.ignore_stock,false) OR (o.in_stock IS DISTINCT FROM false
         AND (o.manage_stock IS DISTINCT FROM true OR coalesce(o.stock,o.stock_quantity) IS NULL
           OR coalesce(o.stock,o.stock_quantity)>0))))))
$$;
REVOKE ALL ON FUNCTION public.product_is_recommendable(uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.search_product_merchandising_candidates(
 p_store_id uuid,p_query text DEFAULT '',p_offset integer DEFAULT 0,p_limit integer DEFAULT 20
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb; query_text text:=left(trim(coalesce(p_query,'')),200);
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.stores WHERE id=p_store_id AND owner_id=auth.uid()) THEN
   RAISE EXCEPTION 'غير مصرح بإدارة منتجات هذا المتجر' USING ERRCODE='42501';
 END IF;
 WITH filtered AS (
   SELECT p.* FROM public.products p WHERE p.store_id=p_store_id AND
     (query_text='' OR strpos(lower(p.name::text),lower(query_text))>0
       OR strpos(lower(coalesce(p.sku,'')),lower(query_text))>0)
 ), page AS (
   SELECT f.* FROM filtered f ORDER BY f.created_at DESC,f.id
   LIMIT least(50,greatest(1,coalesce(p_limit,20))) OFFSET greatest(0,coalesce(p_offset,0))
 ) SELECT jsonb_build_object('total',(SELECT count(*) FROM filtered),'products',coalesce((
   SELECT jsonb_agg(jsonb_build_object('id',p.id,'store_id',p.store_id,'name',p.name,'images',p.images,
     'price',p.price,'sale_price',p.sale_price,'status',p.status,'catalog_visibility',p.catalog_visibility,
     'sku',p.sku,'stock_quantity',p.stock_quantity,'track_inventory',p.track_inventory,'ignore_stock',p.ignore_stock,
     'has_variants',EXISTS(SELECT 1 FROM public.product_variants v WHERE v.product_id=p.id),
     'buyable',public.product_is_recommendable(p.id)) ORDER BY p.created_at DESC,p.id) FROM page p
 ),'[]'::jsonb)) INTO result;
 RETURN result;
END $$;

CREATE FUNCTION public.get_product_recommendations(p_product_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE source_store uuid; chosen_mode text; chosen_title jsonb; chosen_limit integer; result jsonb;
BEGIN
 SELECT p.store_id,coalesce(m.mode,'auto'),coalesce(m.title,'{}'::jsonb),coalesce(m.display_limit,4)
 INTO source_store,chosen_mode,chosen_title,chosen_limit
 FROM public.public_products p LEFT JOIN public.product_merchandising m ON m.product_id=p.id
 WHERE p.id=p_product_id;
 IF NOT FOUND THEN RETURN jsonb_build_object('title','{}'::jsonb,'mode','off','products','[]'::jsonb); END IF;
 IF chosen_mode='off' THEN RETURN jsonb_build_object('title',chosen_title,'mode',chosen_mode,'products','[]'::jsonb); END IF;
 WITH eligible AS (
   SELECT p.*,r.sort_order,
     EXISTS(SELECT 1 FROM public.product_categories theirs
       JOIN public.product_categories ours ON ours.category_id=theirs.category_id
       WHERE theirs.product_id=p.id AND ours.product_id=p_product_id) AS same_category
   FROM public.public_catalog_products p
   LEFT JOIN public.product_recommendations r ON r.product_id=p_product_id AND r.recommended_product_id=p.id
   WHERE p.store_id=source_store AND p.id<>p_product_id
     AND (chosen_mode='auto' OR r.product_id IS NOT NULL)
     AND public.product_is_recommendable(p.id)
 ), ranked AS (
   SELECT e.*,row_number() OVER(ORDER BY
     CASE WHEN chosen_mode='manual' THEN e.sort_order END,
     CASE WHEN chosen_mode='auto' THEN e.same_category END DESC,e.created_at DESC,e.id) AS position
   FROM eligible e
 ), selected AS (
   SELECT r.* FROM ranked r ORDER BY r.position LIMIT least(chosen_limit,8)
 ) SELECT coalesce(jsonb_agg((to_jsonb(s)-'sort_order'-'same_category'-'position') ||
   jsonb_build_object('has_variants',EXISTS(SELECT 1 FROM public.product_variants v WHERE v.product_id=s.id))
   ORDER BY s.position),'[]'::jsonb) INTO result FROM selected s;
 RETURN jsonb_build_object('title',chosen_title,'mode',chosen_mode,'products',result);
END $$;

-- Preserve the existing return signature for legacy search callers.
CREATE OR REPLACE FUNCTION public.search_and_filter_products(
 p_store_id uuid,p_query text DEFAULT '',p_category_id uuid DEFAULT NULL,
 p_min_price decimal DEFAULT NULL,p_max_price decimal DEFAULT NULL,
 p_sort_by text DEFAULT 'newest',p_limit integer DEFAULT 20,p_offset integer DEFAULT 0
) RETURNS TABLE(id uuid,name jsonb,description jsonb,price decimal,compare_at_price decimal,
 images jsonb,status text,created_at timestamptz,total_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE query_text text:=left(trim(coalesce(p_query,'')),200);
BEGIN
 RETURN QUERY WITH filtered AS (
   SELECT p.id,p.name,p.description,p.price,p.compare_at_price,p.images,p.status,p.created_at
   FROM public.public_catalog_products p WHERE p.store_id=p_store_id
     AND (query_text='' OR strpos(lower(p.name::text),lower(query_text))>0
       OR strpos(lower(coalesce(p.description::text,'')),lower(query_text))>0
       OR strpos(lower(coalesce(p.sku,'')),lower(query_text))>0)
     AND (p_category_id IS NULL OR EXISTS(SELECT 1 FROM public.product_categories pc
       WHERE pc.product_id=p.id AND pc.category_id=p_category_id))
     AND (p_min_price IS NULL OR p.price>=p_min_price)
     AND (p_max_price IS NULL OR p.price<=p_max_price)
 ) SELECT f.id,f.name,f.description,f.price,f.compare_at_price,f.images,f.status,f.created_at,count(*) OVER()
 FROM filtered f ORDER BY CASE WHEN p_sort_by='price_asc' THEN f.price END ASC,
   CASE WHEN p_sort_by='price_desc' THEN f.price END DESC,f.created_at DESC,f.id
 LIMIT least(100,greatest(1,coalesce(p_limit,20))) OFFSET greatest(0,coalesce(p_offset,0));
END $$;

REVOKE ALL ON FUNCTION public.get_product_merchandising(uuid),
 public.save_product_merchandising(uuid,integer,text,text,jsonb,integer,uuid[]),
 public.set_product_visibility_bulk(uuid,uuid[],text),
 public.search_product_merchandising_candidates(uuid,text,integer,integer)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_merchandising(uuid),
 public.save_product_merchandising(uuid,integer,text,text,jsonb,integer,uuid[]),
 public.set_product_visibility_bulk(uuid,uuid[],text),
 public.search_product_merchandising_candidates(uuid,text,integer,integer) TO authenticated;
REVOKE ALL ON FUNCTION public.get_product_recommendations(uuid),
 public.search_and_filter_products(uuid,text,uuid,numeric,numeric,text,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_product_recommendations(uuid),
 public.search_and_filter_products(uuid,text,uuid,numeric,numeric,text,integer,integer) TO anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
