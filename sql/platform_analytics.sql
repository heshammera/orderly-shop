-- =============================================
-- Platform Analytics Tables (Idempotent Version)
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Platform Visits
CREATE TABLE IF NOT EXISTS platform_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    page_path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_visits_created_at ON platform_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_visits_visitor_id ON platform_visits(visitor_id);

-- 2. Online Users
CREATE TABLE IF NOT EXISTS online_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id),
    user_type TEXT NOT NULL DEFAULT 'visitor',
    current_page TEXT NOT NULL,
    store_name TEXT,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_online_users_last_seen ON online_users(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_online_users_visitor_id ON online_users(visitor_id);

-- Update user_type constraint (Idempotent)
DO $$
BEGIN
    ALTER TABLE online_users DROP CONSTRAINT IF EXISTS online_users_user_type_check;
    ALTER TABLE online_users ADD CONSTRAINT online_users_user_type_check 
        CHECK (user_type IN ('admin', 'store_owner', 'visitor'));
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- RLS Enable
ALTER TABLE platform_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to allow re-run
DROP POLICY IF EXISTS "Allow anonymous insert on platform_visits" ON platform_visits;
DROP POLICY IF EXISTS "Allow service role select on platform_visits" ON platform_visits;
DROP POLICY IF EXISTS "Allow anonymous insert on online_users" ON online_users;
DROP POLICY IF EXISTS "Allow anonymous update on online_users" ON online_users;
DROP POLICY IF EXISTS "Allow select on online_users" ON online_users;
DROP POLICY IF EXISTS "Allow delete on online_users" ON online_users;

-- Re-create Platform Visits Policies
CREATE POLICY "Allow anonymous insert on platform_visits"
    ON platform_visits FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow service role select on platform_visits"
    ON platform_visits FOR SELECT
    USING (true);

-- Re-create Online Users Policies
CREATE POLICY "Allow anonymous insert on online_users"
    ON online_users FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow anonymous update on online_users"
    ON online_users FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow select on online_users"
    ON online_users FOR SELECT
    USING (true);

CREATE POLICY "Allow delete on online_users"
    ON online_users FOR DELETE
    USING (true);

-- Cleanup function
CREATE OR REPLACE FUNCTION cleanup_stale_online_users()
RETURNS void AS $$
BEGIN
    DELETE FROM online_users WHERE last_seen < NOW() - INTERVAL '2 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
