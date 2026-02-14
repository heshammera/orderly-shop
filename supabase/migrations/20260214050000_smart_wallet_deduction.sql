-- Function to get store plan usage details
CREATE OR REPLACE FUNCTION public.get_store_plan_usage(p_store_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_plan_limit INT;
    v_current_usage INT;
    v_plan_name TEXT;
    v_start_date TIMESTAMPTZ;
    v_end_date TIMESTAMPTZ;
BEGIN
    -- 1. Get Active Subscription & Plan Limits
    SELECT 
        (p.limits->>'orders_monthly')::INT,
        CASE WHEN CURRENT_DATE < s.current_period_end THEN s.current_period_start ELSE date_trunc('month', now()) END,
        CASE WHEN CURRENT_DATE < s.current_period_end THEN s.current_period_end ELSE (date_trunc('month', now()) + interval '1 month') END,
        COALESCE(p.name->>'en', 'Free')
    INTO v_plan_limit, v_start_date, v_end_date, v_plan_name
    FROM public.store_subscriptions s
    JOIN public.plans p ON s.plan_id = p.id
    WHERE s.store_id = p_store_id 
    AND s.status = 'active'
    LIMIT 1;

    -- Default to 0/Free if no active subscription found (treat as Free plan with 0 limit?? Or maybe just default to strict?)
    -- Actually, if no subscription, they might be on a default free plan or no plan.
    -- Let's handle nulls.
    IF v_plan_limit IS NULL THEN
        v_plan_limit := 0; -- Assume 0 if not found, or maybe unlimited? No, safe to assume strict.
        v_start_date := date_trunc('month', now());
        v_end_date := (date_trunc('month', now()) + interval '1 month');
    END IF;

    -- 2. Count Orders in current period
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
        'end_date', v_end_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Update the commission deduction trigger
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
    -- We need to check if the store is within their plan's order limit.
    -- Logic: If (Usage <= Limit), DO NOT DEDUCT.
    
    -- Get Plan Limit
    SELECT (p.limits->>'orders_monthly')::INT
    INTO v_plan_limit
    FROM public.store_subscriptions s
    JOIN public.plans p ON s.plan_id = p.id
    WHERE s.store_id = NEW.store_id 
    AND s.status = 'active'
    LIMIT 1;

    -- If no plan or limit is null, assume 0 (strict mode) or handle as per business logic.
    -- Let's assume if no plan, we fallback to standard commission deduction immediately.
    IF v_plan_limit IS NOT NULL AND v_plan_limit > 0 THEN
        -- Get Start of current month/billing period
        -- For simplicity, let's use calendar month or subscription start?
        -- User said "monthly", usually implies calendar month or billing cycle.
        -- Let's stick to calendar month for now to define "monthly orders" unless subscription dates are strict.
        v_start_date := date_trunc('month', now());

        -- Count orders for this store in this month
        -- Note: This count INCLUDES the current new order because trigger is AFTER INSERT?
        -- Wait, trigger is AFTER INSERT. So count(*) will include the NEW row.
        SELECT COUNT(*) INTO v_current_usage
        FROM public.orders
        WHERE store_id = NEW.store_id
        AND created_at >= v_start_date;

        -- SMART LOGIC:
        -- If usage (including this one) is <= limit, then it's covered by the plan.
        -- No commission deduction.
        IF v_current_usage <= v_plan_limit THEN
            RETURN NEW; 
        END IF;
        
        -- If we are here, usage > limit. Proceed to deduct.
    END IF;


    -- 3. Calculate Commission (Standard Logic)
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
            store_id,
            amount,
            type,
            reference_id,
            description,
            created_at
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
