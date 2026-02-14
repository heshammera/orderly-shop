-- User Management System

-- 1. Add ban columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- 2. RPC: Get All Users Paginated (with Store Aggregation)
CREATE OR REPLACE FUNCTION get_all_users_paginated(
    p_page INT DEFAULT 1,
    p_limit INT DEFAULT 10,
    p_search TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL -- 'all', 'active', 'banned'
)
RETURNS JSON AS $$
DECLARE
    v_offset INT;
    v_total_count INT;
    v_users JSON;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    -- Get Total Count
    SELECT COUNT(*) INTO v_total_count
    FROM profiles p
    JOIN auth.users u ON p.user_id = u.id
    WHERE (p_search IS NULL 
           OR p.full_name ILIKE '%' || p_search || '%' 
           OR u.email ILIKE '%' || p_search || '%'
           OR p.phone ILIKE '%' || p_search || '%')
      AND (p_status IS NULL 
           OR p_status = 'all' 
           OR (p_status = 'banned' AND p.is_banned = TRUE)
           OR (p_status = 'active' AND p.is_banned = FALSE));

    -- Get Data
    SELECT json_agg(t) INTO v_users
    FROM (
        SELECT 
            p.id as profile_id,
            p.user_id,
            p.full_name,
            p.phone,
            p.created_at,
            p.is_banned,
            p.ban_reason,
            u.email,
            (SELECT COUNT(*) FROM stores s WHERE s.owner_id = p.user_id) as total_stores,
            (
                SELECT json_agg(json_build_object(
                    'id', s.id,
                    'name', s.name,
                    'slug', s.slug,
                    'status', s.status,
                    'balance', s.balance,
                    'currency', s.currency,
                    'plan_name', (SELECT name_ar FROM plans pl JOIN store_subscriptions ss ON ss.plan_id = pl.id WHERE ss.store_id = s.id AND ss.status = 'active' LIMIT 1)
                ))
                FROM stores s 
                WHERE s.owner_id = p.user_id
            ) as stores
        FROM profiles p
        JOIN auth.users u ON p.user_id = u.id
        WHERE (p_search IS NULL 
               OR p.full_name ILIKE '%' || p_search || '%' 
               OR u.email ILIKE '%' || p_search || '%'
               OR p.phone ILIKE '%' || p_search || '%')
          AND (p_status IS NULL 
               OR p_status = 'all' 
               OR (p_status = 'banned' AND p.is_banned = TRUE)
               OR (p_status = 'active' AND p.is_banned = FALSE))
        ORDER BY p.created_at DESC
        LIMIT p_limit OFFSET v_offset
    ) t;

    RETURN json_build_object(
        'data', COALESCE(v_users, '[]'::json),
        'total', v_total_count,
        'page', p_page,
        'limit', p_limit
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: Ban Account (Cascading)
CREATE OR REPLACE FUNCTION admin_ban_account(
    p_user_id UUID,
    p_reason TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Update Profile
    UPDATE profiles 
    SET is_banned = TRUE, 
        ban_reason = p_reason 
    WHERE user_id = p_user_id;

    -- Ban all stores owned by this user
    UPDATE stores 
    SET status = 'banned', 
        status_reason = 'Account Banned: ' || p_reason 
    WHERE owner_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: Unban Account
CREATE OR REPLACE FUNCTION admin_unban_account(
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Update Profile
    UPDATE profiles 
    SET is_banned = FALSE, 
        ban_reason = NULL 
    WHERE user_id = p_user_id;

    -- Unban stores (Optional: Restore to active or maintenance? Let's safeguard to active only if they were banned by us)
    -- Simplicity: User can manually fix stores if complex state. 
    -- Or logic: Set stores with status 'banned' back to 'active'.
    UPDATE stores 
    SET status = 'active', 
        status_reason = NULL 
    WHERE owner_id = p_user_id AND status = 'banned';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
