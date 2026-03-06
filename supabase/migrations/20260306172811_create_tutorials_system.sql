-- Create Tutorial Categories Table
CREATE TABLE IF NOT EXISTS public.tutorial_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name JSONB NOT NULL, -- {ar: '...', en: '...'}
    slug TEXT UNIQUE NOT NULL,
    sort_order INT DEFAULT 0,
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tutorial_categories ENABLE ROW LEVEL SECURITY;

-- Policies for tutorial_categories
CREATE POLICY "Public can read tutorial categories"
    ON public.tutorial_categories FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage tutorial categories"
    ON public.tutorial_categories FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_tutorial_categories_updated_at
    BEFORE UPDATE ON public.tutorial_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create Tutorials Table
CREATE TABLE IF NOT EXISTS public.tutorials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title JSONB NOT NULL, -- {ar: '...', en: '...'}
    description JSONB, -- {ar: '...', en: '...'}
    video_type TEXT NOT NULL CHECK (video_type IN ('youtube', 'vimeo', 'dailymotion', 'upload', 'other')),
    video_url TEXT,
    video_id TEXT,
    uploaded_video_path TEXT,
    thumbnail_url TEXT,
    category_id UUID REFERENCES public.tutorial_categories(id) ON DELETE SET NULL,
    slug TEXT UNIQUE NOT NULL,
    sort_order INT DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    display_mode TEXT DEFAULT 'both' CHECK (display_mode IN ('listing', 'standalone', 'both')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

-- Policies for tutorials
CREATE POLICY "Public can read published tutorials"
    ON public.tutorials FOR SELECT
    USING (is_published = true);

CREATE POLICY "Admins can read all tutorials"
    ON public.tutorials FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage tutorials"
    ON public.tutorials FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_tutorials_updated_at
    BEFORE UPDATE ON public.tutorials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create a storage bucket for tutorials if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('tutorials', 'tutorials', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public Access to tutorials bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Public Access for tutorials'
  ) THEN
    CREATE POLICY "Public Access for tutorials"
      ON storage.objects FOR SELECT
      USING ( bucket_id = 'tutorials' );
  END IF;
END $$;

-- Policy: Admins can upload to tutorials bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Admins can upload tutorials'
  ) THEN
    CREATE POLICY "Admins can upload tutorials"
      ON storage.objects FOR INSERT
      WITH CHECK ( bucket_id = 'tutorials' AND public.has_role(auth.uid(), 'admin') );
  END IF;
END $$;

-- Policy: Admins can update tutorials bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Admins can update tutorials'
  ) THEN
    CREATE POLICY "Admins can update tutorials"
      ON storage.objects FOR UPDATE
      WITH CHECK ( bucket_id = 'tutorials' AND public.has_role(auth.uid(), 'admin') );
  END IF;
END $$;

-- Policy: Admins can delete from tutorials bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Admins can delete tutorials'
  ) THEN
    CREATE POLICY "Admins can delete tutorials"
      ON storage.objects FOR DELETE
      USING ( bucket_id = 'tutorials' AND public.has_role(auth.uid(), 'admin') );
  END IF;
END $$;

-- Insert default system settings for tutorials
INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('tutorials_enabled_landing', 'true'::jsonb, 'Toggle visibility of tutorials on the main landing page'),
    ('tutorials_enabled_dashboard', 'true'::jsonb, 'Toggle visibility of tutorials in the merchant dashboard')
ON CONFLICT (key) DO NOTHING;
