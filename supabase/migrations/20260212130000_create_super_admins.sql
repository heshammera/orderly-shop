-- Enable pgcrypto for hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create super_admins table
CREATE TABLE IF NOT EXISTS super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create super_admin_sessions table
CREATE TABLE IF NOT EXISTS super_admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES super_admins(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_super_admin_sessions_token ON super_admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_super_admin_sessions_admin_id ON super_admin_sessions(admin_id);

-- 4. RLS - Deny all public access by default
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to super_admins" ON super_admins FOR ALL USING (false);
CREATE POLICY "No public access to super_admin_sessions" ON super_admin_sessions FOR ALL USING (false);

-- 5. Seed Initial Admin (Password: password123)
-- Only insert if not exists
INSERT INTO super_admins (email, password_hash, full_name)
SELECT 'admin@social-commerce.com', crypt('password123', gen_salt('bf')), 'Super Admin'
WHERE NOT EXISTS (SELECT 1 FROM super_admins WHERE email = 'admin@social-commerce.com');

-- 6. RPC Function for Login
CREATE OR REPLACE FUNCTION login_super_admin(
    p_email TEXT,
    p_password TEXT,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_admin_id UUID;
    v_token TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check credentials
    SELECT id INTO v_admin_id
    FROM super_admins
    WHERE email = p_email 
      AND password_hash = crypt(p_password, password_hash)
      AND is_active = true;

    IF v_admin_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Invalid credentials');
    END IF;

    -- Generate secure token (64 hex chars)
    v_token := encode(gen_random_bytes(32), 'hex');
    v_expires_at := NOW() + INTERVAL '24 hours';

    -- Create session
    INSERT INTO super_admin_sessions (admin_id, token, user_agent, ip_address, expires_at)
    VALUES (v_admin_id, v_token, p_user_agent, p_ip_address, v_expires_at);

    RETURN json_build_object(
        'success', true,
        'token', v_token,
        'expires_at', v_expires_at,
        'admin_id', v_admin_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC Function to Validate Session
CREATE OR REPLACE FUNCTION validate_super_admin_session(p_token TEXT)
RETURNS JSON AS $$
DECLARE
    v_session_record RECORD;
    v_admin_record RECORD;
BEGIN
    -- Find valid session
    SELECT * INTO v_session_record
    FROM super_admin_sessions
    WHERE token = p_token AND expires_at > NOW();

    IF v_session_record IS NULL THEN
        RETURN json_build_object('valid', false);
    END IF;

    -- Get admin details
    SELECT id, email, full_name INTO v_admin_record
    FROM super_admins
    WHERE id = v_session_record.admin_id;

    RETURN json_build_object(
        'valid', true,
        'admin', json_build_object(
            'id', v_admin_record.id,
            'email', v_admin_record.email,
            'full_name', v_admin_record.full_name
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RPC Function to Logout
CREATE OR REPLACE FUNCTION logout_super_admin(p_token TEXT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM super_admin_sessions WHERE token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
