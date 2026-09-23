BEGIN;
CREATE TABLE IF NOT EXISTS public.theme_studio_presets(folder_name text PRIMARY KEY, document jsonb NOT NULL);
ALTER TABLE public.theme_studio_presets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS studio_preset_read ON public.theme_studio_presets;
CREATE POLICY studio_preset_read ON public.theme_studio_presets FOR SELECT USING(true);
GRANT SELECT ON public.theme_studio_presets TO anon,authenticated;
CREATE TABLE IF NOT EXISTS public.store_theme_drafts(
 store_theme_id uuid PRIMARY KEY REFERENCES public.store_themes(id) ON DELETE CASCADE,
 document jsonb NOT NULL,revision integer NOT NULL DEFAULT 0,updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.store_theme_history(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),store_theme_id uuid NOT NULL REFERENCES public.store_themes(id) ON DELETE CASCADE,
 document jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_theme_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_theme_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS studio_draft_read ON public.store_theme_drafts;
CREATE POLICY studio_draft_read ON public.store_theme_drafts FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.store_themes st WHERE st.id=store_theme_id AND public.is_store_member(auth.uid(),st.store_id)));
DROP POLICY IF EXISTS studio_history_read ON public.store_theme_history;
CREATE POLICY studio_history_read ON public.store_theme_history FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.store_themes st WHERE st.id=store_theme_id AND public.is_store_member(auth.uid(),st.store_id)));
GRANT SELECT ON public.store_theme_drafts,public.store_theme_history TO authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.store_theme_drafts,public.store_theme_history FROM authenticated,anon;

CREATE OR REPLACE FUNCTION public.studio_published_document(p_theme uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('tokens',s.global_tokens,'pages',coalesce((SELECT jsonb_object_agg(t.page_type,t.settings_data) FROM store_theme_templates t WHERE t.store_theme_id=s.id),'{}'::jsonb)) FROM store_themes s WHERE s.id=p_theme
$$;
REVOKE ALL ON FUNCTION public.studio_published_document(uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.studio_validate_document(d jsonb) RETURNS void LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE p text; body jsonb; sid text; section jsonb; required_type text;
BEGIN
 IF d IS NULL OR octet_length(d::text)>1000000 OR jsonb_typeof(d->'tokens') IS DISTINCT FROM 'object' OR jsonb_typeof(d->'pages') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'بيانات التصميم غير صالحة'; END IF;
 FOREACH p IN ARRAY ARRAY['home','product','checkout','products'] LOOP
  body:=d->'pages'->p;
  IF jsonb_typeof(body->'sections_order') IS DISTINCT FROM 'array' OR jsonb_typeof(body->'sections_data') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'صفحة التصميم غير مكتملة: %',p; END IF;
  IF jsonb_array_length(body->'sections_order') NOT BETWEEN 1 AND 30 THEN RAISE EXCEPTION 'عدد الأقسام يجب أن يكون بين 1 و30'; END IF;
  IF (SELECT count(*)<>count(DISTINCT value) FROM jsonb_array_elements_text(body->'sections_order')) THEN RAISE EXCEPTION 'توجد أقسام مكررة'; END IF;
  FOR sid IN SELECT jsonb_array_elements_text(body->'sections_order') LOOP
   section:=body->'sections_data'->sid;
   IF sid !~ '^[a-zA-Z0-9_-]{1,80}$' OR coalesce(section->>'type','') NOT IN ('header','hero_banner','category_slider','featured_grid','footer','rich_text','image_banner','benefits','main_product','main_checkout','main_products') OR jsonb_typeof(section->'settings') IS DISTINCT FROM 'object' OR jsonb_typeof(section->'blocks') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'بيانات القسم غير صالحة'; END IF;
  END LOOP;
  required_type:=CASE p WHEN 'product' THEN 'main_product' WHEN 'checkout' THEN 'main_checkout' WHEN 'products' THEN 'main_products' ELSE NULL END;
  IF required_type IS NOT NULL AND (SELECT count(*) FROM jsonb_array_elements_text(body->'sections_order') id WHERE body->'sections_data'->id->>'type'=required_type AND coalesce((body->'sections_data'->id->>'hidden')::boolean,false)=false)<>1 THEN RAISE EXCEPTION 'يجب الحفاظ على قسم المنتج أو الطلب الأساسي'; END IF;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.studio_validate_document(jsonb) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.activate_studio_theme(p_store uuid,p_folder text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE version_id uuid; target uuid; doc jsonb; page record;
BEGIN
 PERFORM 1 FROM stores WHERE id=p_store FOR UPDATE;
 IF NOT FOUND OR is_store_member(auth.uid(),p_store) IS NOT TRUE THEN RAISE EXCEPTION 'غير مصرح بإدارة هذا المتجر'; END IF;
 SELECT v.id,pr.document INTO version_id,doc FROM themes t JOIN theme_versions v ON v.theme_id=t.id AND v.version='2.0.0' JOIN theme_studio_presets pr ON pr.folder_name=t.folder_name WHERE t.folder_name=p_folder AND NOT v.is_deprecated;
 IF version_id IS NULL THEN RAISE EXCEPTION 'الثيم غير متاح'; END IF;
 INSERT INTO store_themes(store_id,theme_version_id,is_active,global_tokens) VALUES(p_store,version_id,false,doc->'tokens') ON CONFLICT(store_id,theme_version_id) DO NOTHING;
 SELECT id INTO target FROM store_themes WHERE store_id=p_store AND theme_version_id=version_id;
 FOR page IN SELECT * FROM jsonb_each(doc->'pages') LOOP
  INSERT INTO store_theme_templates(store_theme_id,page_type,settings_data) VALUES(target,page.key,page.value) ON CONFLICT(store_theme_id,page_type) DO NOTHING;
 END LOOP;
 UPDATE store_themes SET is_active=false WHERE store_id=p_store AND is_active AND id<>target;
 UPDATE store_themes SET is_active=true WHERE id=target;
 RETURN target;
END $$;

CREATE OR REPLACE FUNCTION public.load_studio_draft(p_theme uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE st store_themes; draft store_theme_drafts;
BEGIN
 SELECT * INTO st FROM store_themes WHERE id=p_theme FOR UPDATE;
 IF NOT FOUND OR is_store_member(auth.uid(),st.store_id) IS NOT TRUE THEN RAISE EXCEPTION 'غير مصرح بإدارة هذا التصميم'; END IF;
 IF st.global_tokens->>'studio_version' IS DISTINCT FROM '2' THEN RAISE EXCEPTION 'هذا التصميم يستخدم المحرر السابق'; END IF;
 INSERT INTO store_theme_drafts(store_theme_id,document) VALUES(p_theme,studio_published_document(p_theme)) ON CONFLICT DO NOTHING;
 SELECT * INTO draft FROM store_theme_drafts WHERE store_theme_id=p_theme;
 RETURN jsonb_build_object('document',draft.document,'revision',draft.revision,'updated_at',draft.updated_at);
END $$;

CREATE OR REPLACE FUNCTION public.save_studio_draft(p_theme uuid,p_document jsonb,p_revision integer,p_publish boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE st store_themes; draft store_theme_drafts; page record;
BEGIN
 SELECT * INTO st FROM store_themes WHERE id=p_theme FOR UPDATE;
 IF NOT FOUND OR is_store_member(auth.uid(),st.store_id) IS NOT TRUE THEN RAISE EXCEPTION 'غير مصرح بإدارة هذا التصميم'; END IF;
 SELECT * INTO draft FROM store_theme_drafts WHERE store_theme_id=p_theme FOR UPDATE;
 IF NOT FOUND OR p_revision IS NULL OR draft.revision<>p_revision THEN RAISE EXCEPTION 'التصميم تغير من جلسة أخرى. أعد تحميل المحرر قبل الحفظ.'; END IF;
 PERFORM studio_validate_document(p_document);
 IF p_publish THEN
  INSERT INTO store_theme_history(store_theme_id,document) VALUES(p_theme,studio_published_document(p_theme));
  UPDATE store_themes SET global_tokens=p_document->'tokens',updated_at=now() WHERE id=p_theme;
  FOR page IN SELECT * FROM jsonb_each(p_document->'pages') LOOP
   INSERT INTO store_theme_templates(store_theme_id,page_type,settings_data) VALUES(p_theme,page.key,page.value) ON CONFLICT(store_theme_id,page_type) DO UPDATE SET settings_data=EXCLUDED.settings_data,updated_at=now();
  END LOOP;
 END IF;
 UPDATE store_theme_drafts SET document=p_document,revision=revision+1,updated_at=now() WHERE store_theme_id=p_theme RETURNING * INTO draft;
 RETURN jsonb_build_object('revision',draft.revision,'updated_at',draft.updated_at);
END $$;
REVOKE ALL ON FUNCTION public.activate_studio_theme(uuid,text),public.load_studio_draft(uuid),public.save_studio_draft(uuid,jsonb,integer,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.activate_studio_theme(uuid,text),public.load_studio_draft(uuid),public.save_studio_draft(uuid,jsonb,integer,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.restore_saved_store_theme(p_store uuid,p_theme uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM 1 FROM stores WHERE id=p_store FOR UPDATE;
 IF NOT FOUND OR is_store_member(auth.uid(),p_store) IS NOT TRUE THEN RAISE EXCEPTION 'غير مصرح بإدارة هذا المتجر'; END IF;
 IF NOT EXISTS(SELECT 1 FROM store_themes WHERE id=p_theme AND store_id=p_store) THEN RAISE EXCEPTION 'التصميم غير موجود في متجرك'; END IF;
 UPDATE store_themes SET is_active=false WHERE store_id=p_store AND is_active AND id<>p_theme;
 UPDATE store_themes SET is_active=true WHERE id=p_theme AND store_id=p_store;
END $$;
REVOKE ALL ON FUNCTION public.restore_saved_store_theme(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.restore_saved_store_theme(uuid,uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
