-- Admin Store Details RPC
-- Returns comprehensive store details for the super admin dashboard

CREATE OR REPLACE FUNCTION get_admin_store_details(p_store_id UUID)
RETURNS JSON AS $$
DECLARE
    v_store JSON;
    v_products_count INT;
    v_orders_count INT;
    v_total_sales NUMERIC;
    v_categories_count INT;
    v_customers_count INT;
    v_visits_count INT;
    v_coupons_count INT;
    v_pending_orders INT;
    v_completed_orders INT;
    v_cancelled_orders INT;
    v_carts_count INT;
    v_active_carts_value NUMERIC;
    v_subscription JSON;
    v_wallet_transactions JSON;
    v_recent_orders JSON;
    v_products JSON;
    v_top_products JSON;
    v_revenue_data JSON;
BEGIN
    -- 1. Store basic info with owner
    SELECT json_build_object(
        'id', s.id,
        'name', s.name,
        'slug', s.slug,
        'status', s.status,
        'status_reason', s.status_reason,
        'logo_url', s.logo_url,
        'currency', s.currency,
        'balance', s.balance,
        'has_unlimited_balance', s.has_unlimited_balance,
        'commission_type', s.commission_type,
        'commission_value', s.commission_value,
        'has_removed_copyright', s.has_removed_copyright,
        'created_at', s.created_at,
        'owner_name', p.full_name,
        'owner_email', au.email,
        'owner_id', s.owner_id
    ) INTO v_store
    FROM stores s
    LEFT JOIN profiles p ON s.owner_id = p.user_id
    LEFT JOIN auth.users au ON s.owner_id = au.id
    WHERE s.id = p_store_id;

    IF v_store IS NULL THEN
        RETURN json_build_object('error', 'Store not found');
    END IF;

    -- 2. Products count
    SELECT COUNT(*) INTO v_products_count FROM products WHERE store_id = p_store_id;

    -- 3. Orders stats
    SELECT COUNT(*) INTO v_orders_count FROM orders WHERE store_id = p_store_id;
    SELECT COALESCE(SUM(total), 0) INTO v_total_sales FROM orders WHERE store_id = p_store_id;
    SELECT COUNT(*) INTO v_pending_orders FROM orders WHERE store_id = p_store_id AND status IN ('pending', 'processing');
    SELECT COUNT(*) INTO v_completed_orders FROM orders WHERE store_id = p_store_id AND status IN ('delivered', 'completed');
    SELECT COUNT(*) INTO v_cancelled_orders FROM orders WHERE store_id = p_store_id AND status = 'cancelled';

    -- 4. Categories count
    SELECT COUNT(*) INTO v_categories_count FROM categories WHERE store_id = p_store_id;

    -- 5. Unique customers count
    SELECT COUNT(DISTINCT customer_snapshot->>'phone') INTO v_customers_count 
    FROM orders WHERE store_id = p_store_id AND customer_snapshot IS NOT NULL;

    -- 6. Visits count
    SELECT COUNT(*) INTO v_visits_count FROM store_visits WHERE store_id = p_store_id;

    -- 7. Coupons count
    SELECT COUNT(*) INTO v_coupons_count FROM coupons WHERE store_id = p_store_id;

    -- 8. Carts & lost revenue
    SELECT COUNT(*) INTO v_carts_count FROM carts WHERE store_id = p_store_id;
    SELECT COALESCE(SUM(ci.quantity * ci.unit_price_at_addition), 0) INTO v_active_carts_value
    FROM carts c
    JOIN cart_items ci ON ci.cart_id = c.id
    WHERE c.store_id = p_store_id AND c.status = 'active';

    -- 9. Current subscription
    SELECT json_build_object(
        'plan_name_ar', pl.name_ar,
        'plan_name_en', pl.name_en,
        'plan_price', pl.price,
        'plan_interval', pl.interval,
        'status', ss.status,
        'starts_at', ss.starts_at,
        'current_period_end', ss.current_period_end,
        'features', pl.features
    ) INTO v_subscription
    FROM store_subscriptions ss
    JOIN plans pl ON pl.id = ss.plan_id
    WHERE ss.store_id = p_store_id AND ss.status = 'active'
    ORDER BY ss.created_at DESC
    LIMIT 1;

    -- 10. Last 20 wallet transactions
    SELECT json_agg(t) INTO v_wallet_transactions
    FROM (
        SELECT id, amount, type, description, created_at
        FROM wallet_transactions
        WHERE store_id = p_store_id
        ORDER BY created_at DESC
        LIMIT 20
    ) t;

    -- 11. Last 20 orders
    SELECT json_agg(t) INTO v_recent_orders
    FROM (
        SELECT id, order_number, status, total, currency, customer_snapshot, created_at
        FROM orders
        WHERE store_id = p_store_id
        ORDER BY created_at DESC
        LIMIT 20
    ) t;

    -- 12. All products with sales data
    SELECT json_agg(t) INTO v_products
    FROM (
        SELECT 
            pr.id,
            pr.name,
            pr.price,
            pr.cost_price,
            pr.stock_quantity as stock,
            pr.status,
            pr.images,
            pr.created_at,
            COALESCE(pv.visit_count, 0) as visit_count,
            COALESCE(ps.total_sold, 0) as total_sold,
            COALESCE(ps.total_revenue, 0) as total_revenue
        FROM products pr
        LEFT JOIN (
            SELECT sv.page_url, COUNT(*) as visit_count
            FROM store_visits sv
            WHERE sv.store_id = p_store_id
            GROUP BY sv.page_url
        ) pv ON pv.page_url LIKE '%' || pr.id::text || '%'
        LEFT JOIN (
            SELECT oi.product_id, 
                   SUM(oi.quantity) as total_sold,
                   SUM(oi.quantity * oi.unit_price) as total_revenue
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE o.store_id = p_store_id
            GROUP BY oi.product_id
        ) ps ON ps.product_id = pr.id
        WHERE pr.store_id = p_store_id
        ORDER BY COALESCE(ps.total_revenue, 0) DESC
    ) t;

    -- 13. Top 10 selling products
    SELECT json_agg(t) INTO v_top_products
    FROM (
        SELECT 
            oi.product_id,
            pr.name as product_name,
            pr.images as product_images,
            SUM(oi.quantity) as total_sold,
            SUM(oi.quantity * oi.unit_price) as total_revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products pr ON pr.id = oi.product_id
        WHERE o.store_id = p_store_id
          AND o.status IN ('pending', 'processing', 'shipped', 'delivered', 'completed')
        GROUP BY oi.product_id, pr.name, pr.images
        ORDER BY total_sold DESC
        LIMIT 10
    ) t;

    -- 14. Revenue data (last 30 days grouped by day)
    SELECT json_agg(t) INTO v_revenue_data
    FROM (
        SELECT 
            TO_CHAR(created_at, 'DD Mon') as day_label,
            DATE(created_at) as day_date,
            SUM(total) as daily_total,
            COUNT(*) as daily_orders
        FROM orders
        WHERE store_id = p_store_id
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at), TO_CHAR(created_at, 'DD Mon')
        ORDER BY day_date ASC
    ) t;

    -- Return everything
    RETURN json_build_object(
        'store', v_store,
        'stats', json_build_object(
            'products_count', v_products_count,
            'orders_count', v_orders_count,
            'total_sales', v_total_sales,
            'categories_count', v_categories_count,
            'customers_count', v_customers_count,
            'visits_count', v_visits_count,
            'coupons_count', v_coupons_count,
            'pending_orders', v_pending_orders,
            'completed_orders', v_completed_orders,
            'cancelled_orders', v_cancelled_orders,
            'carts_count', v_carts_count,
            'active_carts_value', v_active_carts_value,
            'aov', CASE WHEN v_orders_count > 0 THEN v_total_sales / v_orders_count ELSE 0 END,
            'conversion_rate', CASE WHEN v_visits_count > 0 THEN (v_orders_count::NUMERIC / v_visits_count::NUMERIC) * 100 ELSE 0 END
        ),
        'subscription', v_subscription,
        'wallet_transactions', COALESCE(v_wallet_transactions, '[]'::json),
        'recent_orders', COALESCE(v_recent_orders, '[]'::json),
        'products', COALESCE(v_products, '[]'::json),
        'top_products', COALESCE(v_top_products, '[]'::json),
        'revenue_data', COALESCE(v_revenue_data, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
