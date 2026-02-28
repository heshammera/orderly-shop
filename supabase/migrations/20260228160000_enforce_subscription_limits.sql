-- Migration to enforce subscription limits via trigger and fix create_store logic

-- 1. Fix create_store RPC to handle unlimited stores (-1) correctly
CREATE OR REPLACE FUNCTION create_store(
    p_name TEXT,
    p_slug TEXT
)
RETURNS UUID AS $$
DECLARE
    v_store_id UUID;
    v_active_stores_count INT;
    v_max_stores INT;
    v_best_plan_id UUID;
    v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 1. Check current active stores count for this user (where they are owner)
    SELECT COUNT(*) INTO v_active_stores_count
    FROM stores
    WHERE owner_id = auth.uid() AND status = 'active';

    -- 2. Determine best active plan and max stores allowed
    SELECT ss.plan_id, COALESCE((p.features->>'stores_limit')::int, 1), ss.current_period_end 
    INTO v_best_plan_id, v_max_stores, v_period_end
    FROM store_subscriptions ss
    JOIN plans p ON ss.plan_id = p.id
    JOIN stores s ON ss.store_id = s.id
    WHERE s.owner_id = auth.uid() AND ss.status IN ('active', 'trialing')
    ORDER BY (p.features->>'stores_limit')::int DESC
    LIMIT 1;

    -- Default if no active plan found
    IF v_max_stores IS NULL THEN
        v_max_stores := 1;
    END IF;

    -- 3. Enforce Limit (-1 means unlimited)
    IF v_max_stores != -1 AND v_active_stores_count >= v_max_stores AND v_active_stores_count > 0 THEN
        RAISE EXCEPTION 'You have reached the limit of stores allowed by your plan (% stores). Please upgrade your plan to add more.', v_max_stores;
    END IF;

    -- 4. Create Store
    INSERT INTO public.stores (owner_id, name, slug, status)
    VALUES (
        auth.uid(), 
        jsonb_build_object('en', p_name, 'ar', p_name), 
        p_slug, 
        CASE WHEN v_best_plan_id IS NOT NULL THEN 'active' ELSE 'pending_plan' END
    )
    RETURNING id INTO v_store_id;

    -- 4.5 Auto-link Subscription if active plan exists
    IF v_best_plan_id IS NOT NULL THEN
        INSERT INTO public.store_subscriptions (store_id, plan_id, status, current_period_start, current_period_end)
        VALUES (v_store_id, v_best_plan_id, 'active', NOW(), v_period_end);
    END IF;

    -- 5. Add as Owner in Members
    INSERT INTO public.store_members (store_id, user_id, role)
    VALUES (v_store_id, auth.uid(), 'owner');

    RETURN v_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Create Product Limit Trigger
CREATE OR REPLACE FUNCTION check_product_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_max_products INT;
    v_current_products INT;
    v_effective_plan JSON;
BEGIN
    -- Get effective plan using existing function
    v_effective_plan := get_store_effective_plan(NEW.store_id);
    
    IF v_effective_plan->>'has_plan' = 'true' THEN
        v_max_products := COALESCE((v_effective_plan->'plan'->'features'->>'products_limit')::INT, 0);
    ELSE
        v_max_products := 0; -- No plan, limit could be strictly 0, or maybe default to 0
    END IF;

    -- If unlimited (-1), allow
    IF v_max_products = -1 THEN
        RETURN NEW;
    END IF;

    -- Count current products for this store
    SELECT COUNT(*) INTO v_current_products
    FROM products
    WHERE store_id = NEW.store_id;

    -- Enforce limit
    IF v_current_products >= v_max_products THEN
        RAISE EXCEPTION 'You have reached the maximum product limit of % for your current plan.', v_max_products;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_product_limit ON products;
CREATE TRIGGER enforce_product_limit
    BEFORE INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_product_limit();
