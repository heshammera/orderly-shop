-- RPC: Get Admin Recharge Requests
CREATE OR REPLACE FUNCTION get_admin_recharge_requests(
    p_status TEXT DEFAULT 'pending',
    p_page INT DEFAULT 1,
    p_limit INT DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
    v_offset INT;
    v_total_count INT;
    v_requests JSON;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    -- Get Total Count
    SELECT COUNT(*) INTO v_total_count
    FROM wallet_recharge_requests
    WHERE (p_status IS NULL OR p_status = 'all' OR status = p_status);

    -- Get Data
    SELECT json_agg(t) INTO v_requests
    FROM (
        SELECT 
            r.id,
            r.amount,
            r.created_at,
            r.status,
            r.payment_proof_url,
            s.name as store_name,
            p.email as owner_email
        FROM wallet_recharge_requests r
        JOIN stores s ON r.store_id = s.id
        JOIN profiles p ON s.owner_id = p.id
        WHERE (p_status IS NULL OR p_status = 'all' OR r.status = p_status)
        ORDER BY r.created_at DESC
        LIMIT p_limit OFFSET v_offset
    ) t;

    RETURN json_build_object(
        'data', COALESCE(v_requests, '[]'::json),
        'total', v_total_count,
        'page', p_page,
        'limit', p_limit
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
