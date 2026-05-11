
-- Create platform_visits table for platform-wide analytics
CREATE TABLE IF NOT EXISTS public.platform_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    page_path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    store_name TEXT, -- Optional: Name of store if visiting a store page
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create online_users table for real-time tracking
CREATE TABLE IF NOT EXISTS public.online_users (
    visitor_id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_type TEXT DEFAULT 'visitor', -- 'visitor', 'admin', 'store_owner'
    current_page TEXT,
    store_name TEXT,
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_users ENABLE ROW LEVEL SECURITY;

-- Policies for platform_visits
CREATE POLICY "Super admins can view all platform visits"
ON public.platform_visits
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.super_admins
        WHERE super_admins.user_id = auth.uid()
    )
);

CREATE POLICY "Anyone can insert platform visits"
ON public.platform_visits
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policies for online_users
CREATE POLICY "Super admins can view all online users"
ON public.online_users
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.super_admins
        WHERE super_admins.user_id = auth.uid()
    )
);

CREATE POLICY "Anyone can upsert their heartbeat"
ON public.online_users
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_visits_created_at ON public.platform_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_platform_visits_visitor_id ON public.platform_visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_online_users_last_seen ON public.online_users(last_seen);
