-- FIX: The trigger and RPC functions reference p.limits which does not exist.
-- The actual column in the plans table is "features".
-- Also s.current_period_start does not exist, it is "starts_at".
-- This caused a 500 error on every order insert for stores without unlimited balance.

-- 1. Fix the commission trigger function
CREATE OR REPLACE FUNCTION public.handle_new_order_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_commission_type TEXT;
    v_commission_value DECIMAL(10,2);
    v_has_unlimited_balance BOOLEAN;
    v_commission_amount DECIMAL(12,2);
    v_plan_limit INT;
    v_current_usage INT;
    v_start_date TIMESTAMPTZ;
BEGIN
    -- 1. Get Store Settings
    SELECT commission_type, commission_value, has_unlimited_balance
    INTO v_commission_type, v_commission_value, v_has_unlimited_balance
    FROM public.stores
    WHERE id = NEW.store_id;

    -- If unlimited balance, skip everything
    IF v_has_unlimited_balance THEN
        RETURN NEW;
    END IF;

    -- 2. Check Plan Limits (Smart Deduction Logic)
    SELECT (p.features->>'orders_monthly')::INT
    INTO v_plan_limit
    FROM public.store_subscriptions s
    JOIN public.plans p ON s.plan_id = p.id
    WHERE s.store_id = NEW.store_id 
    AND s.status = 'active'
    LIMIT 1;

    IF v_plan_limit IS NOT NULL AND v_plan_limit > 0 THEN
        v_start_date := date_trunc('month', now());

        SELECT COUNT(*) INTO v_current_usage
        FROM public.orders
        WHERE store_id = NEW.store_id
        AND created_at >= v_start_date;

        IF v_current_usage <= v_plan_limit THEN
            RETURN NEW; 
        END IF;
    END IF;

    -- 3. Calculate Commission
    IF v_commission_type = 'percentage' THEN
        v_commission_amount := (NEW.total * v_commission_value) / 100;
    ELSE
        v_commission_amount := v_commission_value;
    END IF;

    -- 4. Deduct if valid
    IF v_commission_amount > 0 THEN
        UPDATE public.stores
        SET balance = balance - v_commission_amount
        WHERE id = NEW.store_id;

        INSERT INTO public.wallet_transactions (
            store_id, amount, type, reference_id, description, created_at
        ) VALUES (
            NEW.store_id,
            -v_commission_amount,
            'commission',
            NEW.id,
            'Commission for Order #' || NEW.order_number || ' (Over limit)',
            now()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Fix get_store_plan_usage function
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
    -- 1. Get Latest Subscription Details
    SELECT 
        s.id,
        (p.features->>'orders_monthly')::INT,
        s.starts_at,
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
    IF v_sub_status = 'active' AND v_end_date < NOW() THEN
        UPDATE public.store_subscriptions 
        SET status = 'past_due', updated_at = NOW() 
        WHERE id = v_sub_id;

        UPDATE public.stores 
        SET status = 'unpaid' 
        WHERE id = p_store_id;

        v_is_expired := true;
        v_sub_status := 'past_due';
    END IF;

    -- 3. Handle Nulls
    IF v_plan_limit IS NULL THEN
        v_plan_limit := 0;
        v_start_date := date_trunc('month', now());
        v_end_date := (date_trunc('month', now()) + interval '1 month');
    END IF;

    IF v_start_date IS NULL THEN
        v_start_date := date_trunc('month', now());
        v_end_date := v_start_date + interval '1 month';
    END IF;

    -- 4. Calculate Usage
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
