-- Fix get_all_stores_paginated to include has_removed_copyright field
-- so the admin dashboard correctly reflects the current state of the toggle

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
    LEFT JOIN profiles p ON s.owner_id = p.user_id
    LEFT JOIN auth.users u ON s.owner_id = u.id
    WHERE (p_search IS NULL 
           OR s.name::text ILIKE '%' || p_search || '%' 
           OR s.slug ILIKE '%' || p_search || '%' 
           OR u.email ILIKE '%' || p_search || '%')
      AND (p_status IS NULL OR p_status = 'all' OR s.status = p_status);

    -- Get Data (now includes has_removed_copyright)
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
            s.has_removed_copyright,
            u.email as owner_email,
            p.full_name as owner_name,
            (SELECT name_ar FROM plans pl JOIN store_subscriptions ss ON ss.plan_id = pl.id WHERE ss.store_id = s.id AND ss.status = 'active' LIMIT 1) as plan_name
        FROM stores s
        LEFT JOIN profiles p ON s.owner_id = p.user_id
        LEFT JOIN auth.users u ON s.owner_id = u.id
        WHERE (p_search IS NULL 
               OR s.name::text ILIKE '%' || p_search || '%' 
               OR s.slug ILIKE '%' || p_search || '%' 
               OR u.email ILIKE '%' || p_search || '%')
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
