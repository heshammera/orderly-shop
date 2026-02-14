-- Modified get_store_plan_usage to include Lazy Expiration Check
CREATE OR REPLACE FUNCTION public.get_store_plan_usage(p_store_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_plan_limit INT;
    v_current_usage INT;
    v_plan_name TEXT;
    v_start_date TIMESTAMPTZ;
    v_end_date TIMESTAMPTZ;
    v_sub_status TEXT;
    v_sub_id UUID;
    v_is_expired BOOLEAN := false;
BEGIN
    -- 1. Get Latest Subscription Details (Active or Past Due)
    SELECT 
        s.id,
        (p.limits->>'orders_monthly')::INT,
        s.current_period_start,
        s.current_period_end,
        COALESCE(p.name->>'en', 'Free'),
        s.status
    INTO v_sub_id, v_plan_limit, v_start_date, v_end_date, v_plan_name, v_sub_status
    FROM public.store_subscriptions s
    JOIN public.plans p ON s.plan_id = p.id
    WHERE s.store_id = p_store_id 
    ORDER BY s.created_at DESC
    LIMIT 1;

    -- 2. LAZY EXPIRATION CHECK
    -- If status is active but date has passed, expire it now.
    IF v_sub_status = 'active' AND v_end_date < NOW() THEN
        -- Update Subscription Status
        UPDATE public.store_subscriptions 
        SET status = 'past_due', updated_at = NOW() 
        WHERE id = v_sub_id;

        -- Update Store Status to 'unpaid' to block access
        UPDATE public.stores 
        SET status = 'unpaid' 
        WHERE id = p_store_id;

        v_is_expired := true;
        v_sub_status := 'past_due';
    END IF;

    -- 3. Handle Nulls / No Subscription
    IF v_plan_limit IS NULL THEN
        v_plan_limit := 0;
        v_start_date := date_trunc('month', now());
        v_end_date := (date_trunc('month', now()) + interval '1 month');
    END IF;

    -- 4. Calculate Usage (Orders count in current period)
    -- If expired, we might still want to show usage of the last valid period or current month?
    -- Let's stick to the period dates derived from subscription or current month.
    
    -- Ensure dates are valid for query
    IF v_start_date IS NULL THEN
        v_start_date := date_trunc('month', now());
        v_end_date := v_start_date + interval '1 month';
    END IF;

    SELECT COUNT(*)
    INTO v_current_usage
    FROM public.orders
    WHERE store_id = p_store_id
    AND created_at >= v_start_date
    AND created_at < v_end_date;

    RETURN jsonb_build_object(
        'limit', v_plan_limit,
        'usage', v_current_usage,
        'plan_name', v_plan_name,
        'start_date', v_start_date,
        'end_date', v_end_date,
        'status', v_sub_status,
        'just_expired', v_is_expired
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
