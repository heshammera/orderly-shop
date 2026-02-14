-- RPC: Create Store (for existing users)
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
    SELECT ss.plan_id, (p.features->>'stores_limit')::int, ss.current_period_end 
    INTO v_best_plan_id, v_max_stores, v_period_end
    FROM store_subscriptions ss
    JOIN plans p ON ss.plan_id = p.id
    JOIN stores s ON ss.store_id = s.id
    WHERE s.owner_id = auth.uid() AND ss.status = 'active'
    ORDER BY (p.features->>'stores_limit')::int DESC
    LIMIT 1;

    -- Default if no active plan found (allow one store as pending_plan)
    IF v_max_stores IS NULL THEN
        v_max_stores := 1;
    END IF;

    -- 3. Enforce Limit
    IF v_active_stores_count >= v_max_stores AND v_active_stores_count > 0 THEN
        RAISE EXCEPTION 'You have reached the limit of stores allowed by your plan (% stores). Please upgrade your plan to add more.', v_max_stores;
    END IF;

    -- 4. Create Store (Construct JSONB for name)
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
        INSERT INTO public.store_subscriptions (store_id, plan_id, status, current_period_end)
        VALUES (v_store_id, v_best_plan_id, 'active', v_period_end);
    END IF;

    -- 5. Add as Owner in Members
    INSERT INTO public.store_members (store_id, user_id, role)
    VALUES (v_store_id, auth.uid(), 'owner');

    RETURN v_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
