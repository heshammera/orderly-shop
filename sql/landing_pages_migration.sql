-- ============================================================
-- Migration: Product Landing Pages
-- ============================================================

-- 1. Create the product_landing_pages table
CREATE TABLE IF NOT EXISTS public.product_landing_pages (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    template        TEXT NOT NULL DEFAULT 'hype' CHECK (template IN ('hype', 'elegant', 'trust')),
    is_enabled      BOOLEAN NOT NULL DEFAULT false,
    is_standalone   BOOLEAN NOT NULL DEFAULT true,
    content         JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One landing page per product
    CONSTRAINT uq_product_landing_page UNIQUE (product_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_landing_pages_store_id ON public.product_landing_pages (store_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_product_id ON public.product_landing_pages (product_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_landing_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_landing_pages_updated_at ON public.product_landing_pages;
CREATE TRIGGER trg_landing_pages_updated_at
    BEFORE UPDATE ON public.product_landing_pages
    FOR EACH ROW EXECUTE FUNCTION update_landing_pages_updated_at();

-- ============================================================
-- 2. RLS Policies
-- ============================================================

ALTER TABLE public.product_landing_pages ENABLE ROW LEVEL SECURITY;

-- Merchants can read their own store's landing pages
CREATE POLICY "landing_pages_select_own" ON public.product_landing_pages
    FOR SELECT USING (
        store_id IN (
            SELECT s.id FROM public.stores s
            JOIN public.store_members sm ON sm.store_id = s.id
            WHERE sm.user_id = auth.uid()
        )
    );

-- Merchants can insert landing pages for their store
CREATE POLICY "landing_pages_insert_own" ON public.product_landing_pages
    FOR INSERT WITH CHECK (
        store_id IN (
            SELECT s.id FROM public.stores s
            JOIN public.store_members sm ON sm.store_id = s.id
            WHERE sm.user_id = auth.uid()
              AND sm.role IN ('owner', 'admin', 'editor')
        )
    );

-- Merchants can update landing pages for their store
CREATE POLICY "landing_pages_update_own" ON public.product_landing_pages
    FOR UPDATE USING (
        store_id IN (
            SELECT s.id FROM public.stores s
            JOIN public.store_members sm ON sm.store_id = s.id
            WHERE sm.user_id = auth.uid()
              AND sm.role IN ('owner', 'admin', 'editor')
        )
    );

-- Merchants can delete landing pages for their store
CREATE POLICY "landing_pages_delete_own" ON public.product_landing_pages
    FOR DELETE USING (
        store_id IN (
            SELECT s.id FROM public.stores s
            JOIN public.store_members sm ON sm.store_id = s.id
            WHERE sm.user_id = auth.uid()
              AND sm.role IN ('owner', 'admin', 'editor')
        )
    );

-- Public can read enabled landing pages (for public route)
CREATE POLICY "landing_pages_select_public" ON public.product_landing_pages
    FOR SELECT USING (is_enabled = true);

-- ============================================================
-- 3. Add plan_features entry for landing_pages
-- (Run this to register the feature in the platform)
-- The Super Admin then assigns it to specific plans via the admin UI
-- ============================================================

INSERT INTO public.plan_features (id, name_ar, name_en, description_ar, description_en, type, "group")
VALUES (
    'landing_pages',
    'صفحات الهبوط المخصصة',
    'Custom Landing Pages',
    'إنشاء صفحات هبوط احترافية لكل منتج مع قوالب جاهزة وتخصيص كامل',
    'Create professional landing pages for each product with ready-made templates and full customization',
    'boolean',
    'marketing'
)
ON CONFLICT (id) DO NOTHING;
