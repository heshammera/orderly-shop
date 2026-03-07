-- Advanced Admin Stats RPCs for Social Commerce Hub - V3 (TABLE RETURN TYPE)
-- This version uses RETURNS TABLE which is more robust for Supabase/PostgREST.

-- Drop ALL old versions first
DROP FUNCTION IF EXISTS get_admin_dashboard_stats_advanced();
DROP FUNCTION IF EXISTS get_admin_historical_trends();
DROP FUNCTION IF EXISTS get_top_performing_stores(int);
DROP FUNCTION IF EXISTS get_sales_by_region();

-- 1. Get Advanced Dashboard Stats (KPIs) - Still returns JSON as it's a single object
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats_advanced()
RETURNS json AS $$
DECLARE
    result json;
    v_total_stores bigint;
    v_active_stores bigint;
    v_total_users bigint;
    v_total_products bigint;
    v_total_orders bigint;
    v_total_gmv numeric;
    v_total_commission numeric;
    v_pending_recharges bigint;
    v_avg_order_value numeric;
    v_conversion_rate numeric;
    v_total_visits bigint;
BEGIN
    SELECT count(*) INTO v_total_stores FROM stores;
    SELECT count(*) INTO v_active_stores FROM stores WHERE status = 'active';
    SELECT count(*) INTO v_total_users FROM profiles;
    SELECT count(*) INTO v_total_products FROM products;
    SELECT count(*) INTO v_total_orders FROM orders WHERE status NOT IN ('cancelled', 'failed');
    SELECT COALESCE(sum(total), 0) INTO v_total_gmv FROM orders WHERE status NOT IN ('cancelled', 'failed');
    SELECT COALESCE(ABS(sum(amount)), 0) INTO v_total_commission FROM wallet_transactions WHERE type = 'commission';
    SELECT count(*) INTO v_pending_recharges FROM wallet_recharge_requests WHERE status = 'pending';
    
    IF v_total_orders > 0 THEN v_avg_order_value := v_total_gmv / v_total_orders; ELSE v_avg_order_value := 0; END IF;

    SELECT count(*) INTO v_total_visits FROM platform_visits;
    IF v_total_visits > 0 THEN
        v_conversion_rate := (v_total_orders::numeric / GREATEST(v_total_visits, v_total_orders)::numeric) * 100;
    ELSE
        v_conversion_rate := 0;
    END IF;

    result := json_build_object(
        'total_stores', v_total_stores,
        'active_stores', v_active_stores,
        'total_users', v_total_users,
        'total_products', v_total_products,
        'total_orders', v_total_orders,
        'total_gmv', v_total_gmv,
        'total_commission', v_total_commission,
        'pending_recharges', v_pending_recharges,
        'avg_order_value', ROUND(v_avg_order_value, 2),
        'conversion_rate', ROUND(v_conversion_rate, 2),
        'total_visits', v_total_visits
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Get Historical Trends
CREATE OR REPLACE FUNCTION get_admin_historical_trends()
RETURNS TABLE (name text, new_stores bigint, orders bigint, revenue numeric) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_char(series.month, 'Mon')::text as name,
        (SELECT count(*) FROM stores WHERE date_trunc('month', created_at) = series.month)::bigint as new_stores,
        (SELECT count(*) FROM orders WHERE date_trunc('month', created_at) = series.month AND status NOT IN ('cancelled', 'failed'))::bigint as orders,
        (SELECT COALESCE(sum(total), 0) FROM orders WHERE date_trunc('month', created_at) = series.month AND status NOT IN ('cancelled', 'failed'))::numeric as revenue
    FROM generate_series(
        date_trunc('month', current_date) - interval '5 months',
        date_trunc('month', current_date),
        interval '1 month'
    ) AS series(month)
    ORDER BY series.month ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Get Top Performing Stores
CREATE OR REPLACE FUNCTION get_top_performing_stores(p_limit int DEFAULT 10)
RETURNS TABLE (id uuid, name jsonb, slug text, status text, orders_count bigint, total_sales numeric, commission_generated numeric) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.slug,
        s.status,
        count(o.id)::bigint as orders_count,
        COALESCE(sum(o.total), 0)::numeric as total_sales,
        (SELECT COALESCE(ABS(sum(amount)), 0)::numeric FROM wallet_transactions wt WHERE wt.store_id = s.id AND wt.type = 'commission') as commission_generated
    FROM stores s
    LEFT JOIN orders o ON o.store_id = s.id AND o.status NOT IN ('cancelled', 'failed')
    GROUP BY s.id, s.name, s.slug, s.status
    ORDER BY total_sales DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Get Sales by Region
CREATE OR REPLACE FUNCTION get_sales_by_region()
RETURNS TABLE (name text, value bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(
            NULLIF(TRIM((shipping_address::jsonb)->>'city'), ''),
            NULLIF(TRIM((customer_snapshot::jsonb)->>'city'), ''),
            'Other'
        )::text as name,
        count(*)::bigint as value
    FROM orders
    WHERE status NOT IN ('cancelled', 'failed')
    GROUP BY 1
    ORDER BY value DESC
    LIMIT 8;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
