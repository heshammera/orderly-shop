-- Fresh-install baseline for tables already used by the storefront and editor.
CREATE TABLE public.themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  folder_name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.theme_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id uuid NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  version text NOT NULL,
  is_deprecated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(theme_id, version)
);
CREATE TABLE public.store_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  theme_version_id uuid NOT NULL REFERENCES public.theme_versions(id),
  is_active boolean NOT NULL DEFAULT false,
  global_tokens jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, theme_version_id)
);
CREATE UNIQUE INDEX store_one_active_theme ON public.store_themes(store_id) WHERE is_active;
CREATE TABLE public.store_theme_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_theme_id uuid NOT NULL REFERENCES public.store_themes(id) ON DELETE CASCADE,
  page_type text NOT NULL,
  settings_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_theme_id, page_type)
);
CREATE TABLE IF NOT EXISTS public.store_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  slug text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_theme_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY themes_read ON public.themes FOR SELECT USING (true);
CREATE POLICY theme_versions_read ON public.theme_versions FOR SELECT USING (true);
CREATE POLICY store_themes_read ON public.store_themes FOR SELECT USING (is_active OR public.is_store_member(auth.uid(), store_id));
CREATE POLICY store_themes_manage ON public.store_themes FOR ALL TO authenticated USING (public.is_store_member(auth.uid(), store_id)) WITH CHECK (public.is_store_member(auth.uid(), store_id));
CREATE POLICY store_templates_read ON public.store_theme_templates FOR SELECT USING (EXISTS(SELECT 1 FROM public.store_themes t WHERE t.id=store_theme_id AND (t.is_active OR public.is_store_member(auth.uid(), t.store_id))));
CREATE POLICY store_templates_manage ON public.store_theme_templates FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.store_themes t WHERE t.id=store_theme_id AND public.is_store_member(auth.uid(), t.store_id))) WITH CHECK (EXISTS(SELECT 1 FROM public.store_themes t WHERE t.id=store_theme_id AND public.is_store_member(auth.uid(), t.store_id)));
CREATE POLICY store_pages_read ON public.store_pages FOR SELECT USING (is_published OR public.is_store_member(auth.uid(), store_id));
CREATE POLICY store_pages_manage ON public.store_pages FOR ALL TO authenticated USING (public.is_store_member(auth.uid(), store_id)) WITH CHECK (public.is_store_member(auth.uid(), store_id));
