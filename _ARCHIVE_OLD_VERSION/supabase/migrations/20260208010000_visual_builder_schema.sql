-- Create store_pages table
CREATE TABLE IF NOT EXISTS public.store_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    slug TEXT NOT NULL, -- 'home', 'about', etc.
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(store_id, slug)
);

-- Enable RLS
ALTER TABLE public.store_pages ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view published pages
CREATE POLICY "Public can view published store pages" ON public.store_pages
    FOR SELECT
    USING (is_published = true);

-- Policy: Store owners/admins can manage their pages
CREATE POLICY "Store owners can manage pages" ON public.store_pages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.store_members
            WHERE store_members.store_id = store_pages.store_id
            AND store_members.user_id = auth.uid()
            AND store_members.role IN ('owner', 'admin', 'editor')
        )
    );

-- Trigger to update updated_at
CREATE TRIGGER update_store_pages_modtime
    BEFORE UPDATE ON public.store_pages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
