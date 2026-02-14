-- Update get_all_stores_paginated to include commission and currency info
-- FIXED: Join with auth.users to get email properly (profiles table doesn't have email)

CREATE OR REPLACE FUNCTION get_all_stores_paginated(
    p_page INT DEFAULT 1,
    p_limit INT DEFAULT 10,
    p_search TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_offset INT;
    v_total_count INT;
    v_stores JSON;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    -- Get Total Count
    SELECT COUNT(*) INTO v_total_count
    FROM stores s
    LEFT JOIN profiles p ON s.owner_id = p.user_id -- Corrected join column
    LEFT JOIN auth.users u ON s.owner_id = u.id -- Join auth.users for email
    WHERE (p_search IS NULL 
           OR s.name::text ILIKE '%' || p_search || '%' 
           OR s.slug ILIKE '%' || p_search || '%' 
           OR u.email ILIKE '%' || p_search || '%') -- Use auth.users email
      AND (p_status IS NULL OR p_status = 'all' OR s.status = p_status);

    -- Get Data
    SELECT json_agg(t) INTO v_stores
    FROM (
        SELECT 
            s.id,
            s.name,
            s.slug,
            s.status,
            s.status_reason,
            s.logo_url,
            s.created_at,
            s.balance,
            s.currency,
            s.commission_type,
            s.commission_value,
            s.has_unlimited_balance,
            u.email as owner_email, -- Get email from auth.users
            p.full_name as owner_name,
            (SELECT name_ar FROM plans pl JOIN store_subscriptions ss ON ss.plan_id = pl.id WHERE ss.store_id = s.id AND ss.status = 'active' LIMIT 1) as plan_name
        FROM stores s
        LEFT JOIN profiles p ON s.owner_id = p.user_id -- Corrected join column
        LEFT JOIN auth.users u ON s.owner_id = u.id -- Join auth.users for email
        WHERE (p_search IS NULL 
               OR s.name::text ILIKE '%' || p_search || '%' 
               OR s.slug ILIKE '%' || p_search || '%' 
               OR u.email ILIKE '%' || p_search || '%') -- Use auth.users email
          AND (p_status IS NULL OR p_status = 'all' OR s.status = p_status)
        ORDER BY s.created_at DESC
        LIMIT p_limit OFFSET v_offset
    ) t;

    RETURN json_build_object(
        'data', COALESCE(v_stores, '[]'::json),
        'total', v_total_count,
        'page', p_page,
        'limit', p_limit
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
