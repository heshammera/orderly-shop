-- 0. Update Stores Status Constraint to include 'suspended'
ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_status_check;
ALTER TABLE stores ADD CONSTRAINT stores_status_check 
CHECK (status IN ('active', 'banned', 'maintenance', 'unpaid', 'pending_plan', 'pending_approval', 'suspended'));

-- 0.1 Add keep_store_ids to subscription_requests
ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS keep_store_ids UUID[];

-- 1. RPC: Check Plan Downgrade Impact
CREATE OR REPLACE FUNCTION check_plan_downgrade_impact(
    p_store_id UUID,
    p_new_plan_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_owner_id UUID;
    v_current_active_stores_count INT;
    v_new_plan_limit INT;
    v_plan_features JSONB;
    v_active_stores JSON;
BEGIN
    -- Get Store Owner
    SELECT owner_id INTO v_owner_id FROM stores WHERE id = p_store_id;
    
    -- Get New Plan Features
    SELECT features INTO v_plan_features FROM plans WHERE id = p_new_plan_id;
    
    -- Parse Limit (Handle -1 as Unlimited)
    v_new_plan_limit := COALESCE((v_plan_features->>'stores_limit')::INT, 1);
    
    -- If Unlimited, no conflict possible regarding stores count
    IF v_new_plan_limit = -1 THEN
        RETURN json_build_object('status', 'ok');
    END IF;

    -- Count ONLY ACTIVE stores for this owner
    SELECT COUNT(*) INTO v_current_active_stores_count
    FROM stores 
    WHERE owner_id = v_owner_id 
    AND status NOT IN ('banned', 'archived', 'suspended'); 
    
    -- Get details of active stores for UI selection
    SELECT json_agg(json_build_object('id', id, 'name', name, 'status', status))
    INTO v_active_stores
    FROM stores
    WHERE owner_id = v_owner_id
    AND status IN ('active', 'unpaid', 'maintenance', 'pending_approval', 'pending_plan');

    IF v_current_active_stores_count > v_new_plan_limit THEN
        RETURN json_build_object(
            'status', 'conflict',
            'conflicts', json_build_object(
                'type', 'stores_limit',
                'current_count', v_current_active_stores_count,
                'new_limit', v_new_plan_limit,
                'stores', v_active_stores
            )
        );
    END IF;

    RETURN json_build_object('status', 'ok');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Update RPC: Approve Subscription Request with Downgrade Handling
CREATE OR REPLACE FUNCTION approve_subscription_request(
    p_request_id UUID,
    p_keep_store_ids UUID[] DEFAULT NULL -- Optional override
)
RETURNS JSON AS $$
DECLARE
    v_req RECORD;
    v_plan RECORD;
    v_interval INTERVAL;
    v_owner_id UUID;
    v_features JSONB;
    v_stores_limit INT;
    v_start_date TIMESTAMPTZ;
    v_final_keep_ids UUID[];
BEGIN
    -- 1. Get Request Details
    SELECT * INTO v_req FROM subscription_requests WHERE id = p_request_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
    
    -- Allow approving if status is pending OR we are calling it internally (logic reuse)
    -- But usually we only call this on pending. 
    -- If called internally from submit_subscription_request, the row is inserted with 'approved' status?
    -- No, let's keep it simple. If status is 'approved', we might be re-running?
    -- Let's stick to: if it's pending, we approve it.
    -- If we call this from submit_subscription_request, we should insert as pending then call this.
    
    IF v_req.status != 'pending' THEN 
        -- If it was just inserted as pending by submit_func, it is pending.
        RAISE EXCEPTION 'Request not pending'; 
    END IF;

    -- 2. Determine Keep IDs (Argument > DB Column > Default None)
    v_final_keep_ids := COALESCE(p_keep_store_ids, v_req.keep_store_ids);

    -- 3. Get Plan Details
    SELECT * INTO v_plan FROM plans WHERE id = v_req.plan_id;
    
    -- 4. Downgrade Logic / Store Suspension
    IF v_final_keep_ids IS NOT NULL THEN
        -- Get Owner
        SELECT owner_id INTO v_owner_id FROM stores WHERE id = v_req.store_id;
        
        -- Validate that the number of kept stores does not exceed the new limit
        v_features := v_plan.features;
        v_stores_limit := COALESCE((v_features->>'stores_limit')::INT, 1);
        
        IF v_stores_limit != -1 AND array_length(v_final_keep_ids, 1) > v_stores_limit THEN
            RAISE EXCEPTION 'Too many stores selected. Limit is %', v_stores_limit;
        END IF;

        -- Suspend all stores NOT in the keep list
        UPDATE stores 
        SET status = 'suspended'
        WHERE owner_id = v_owner_id
        AND id != ALL(v_final_keep_ids)
        AND status NOT IN ('banned', 'archived'); 
        
        -- Ensure kept stores are active (if they were suspended or pending)
        UPDATE stores
        SET status = 'active'
        WHERE id = ANY(v_final_keep_ids)
        AND status IN ('suspended', 'pending_plan', 'pending_approval', 'unpaid');
    END IF;

    -- 5. Determine interval
    IF v_plan.interval = 'monthly' THEN v_interval := interval '1 month';
    ELSIF v_plan.interval = 'yearly' THEN v_interval := interval '1 year';
    ELSE v_interval := interval '100 years'; END IF;

    -- 6. Create/Update Subscription
    v_start_date := NOW();

    INSERT INTO store_subscriptions (store_id, plan_id, status, current_period_start, current_period_end)
    VALUES (v_req.store_id, v_req.plan_id, 'active', v_start_date, v_start_date + v_interval)
    ON CONFLICT (store_id) 
    DO UPDATE SET 
        plan_id = EXCLUDED.plan_id,
        status = 'active',
        current_period_start = v_start_date,
        current_period_end = v_start_date + v_interval,
        updated_at = NOW();

    -- 7. Activate Store (The one being paid for - ensure it is active even if not in keep list? 
    -- The paid store SHOULD be in keep list if limit > 0. If user didn't select it, that's weird.
    -- But let's force consistent status.)
    UPDATE stores SET status = 'active' WHERE id = v_req.store_id;

    -- 8. Update Request
    UPDATE subscription_requests SET status = 'approved', updated_at = NOW() WHERE id = p_request_id;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Update submit_subscription_request to handle keep_store_ids and Auto-Approve
CREATE OR REPLACE FUNCTION submit_subscription_request(
    p_store_id UUID,
    p_plan_id UUID,
    p_payment_method TEXT,
    p_amount NUMERIC,
    p_transaction_id TEXT DEFAULT NULL,
    p_receipt_url TEXT DEFAULT NULL,
    p_keep_store_ids UUID[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_request_id UUID;
BEGIN
    -- Insert Request (Always insert as pending first)
    INSERT INTO subscription_requests (
        store_id, plan_id, user_id, amount, payment_method, transaction_id, receipt_url, status, keep_store_ids
    ) VALUES (
        p_store_id, p_plan_id, auth.uid(), p_amount, p_payment_method, p_transaction_id, p_receipt_url, 
        'pending', -- Always pending initially
        p_keep_store_ids
    )
    RETURNING id INTO v_request_id;

    -- If Free Plan (amount 0), Auto-Approve logic immediately
    IF p_amount = 0 THEN
        -- Call approve_subscription_request to handle logic (subscriptions, suspension, etc.)
        PERFORM approve_subscription_request(v_request_id, p_keep_store_ids);
    ELSE
        -- Set Store Status to Pending Approval
        UPDATE stores SET status = 'pending_approval' WHERE id = p_store_id;
    END IF;

    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. [NEW] RPC: Get Owner Effective Plan
CREATE OR REPLACE FUNCTION get_owner_effective_plan(p_owner_id UUID)
RETURNS JSON AS $$
DECLARE
    v_best_sub RECORD;
BEGIN
    SELECT 
        ss.status,
        ss.current_period_end,
        p.id as plan_id,
        p.name_ar,
        p.name_en,
        p.features,
        p.price_monthly,
        s.id as source_store_id
    INTO v_best_sub
    FROM store_subscriptions ss
    JOIN stores s ON ss.store_id = s.id
    JOIN plans p ON ss.plan_id = p.id
    WHERE s.owner_id = p_owner_id
    AND ss.status IN ('active', 'trialing')
    AND ss.current_period_end > NOW()
    ORDER BY p.price_monthly DESC
    LIMIT 1;

    -- If found, return details
    IF FOUND THEN
        RETURN json_build_object(
            'has_plan', true,
            'plan', json_build_object(
                'id', v_best_sub.plan_id,
                'name', json_build_object('ar', v_best_sub.name_ar, 'en', v_best_sub.name_en),
                'features', v_best_sub.features
            ),
            'subscription', json_build_object(
                'status', v_best_sub.status,
                'current_period_end', v_best_sub.current_period_end,
                'source_store_id', v_best_sub.source_store_id
            )
        );
    END IF;

    -- If no plan found
    RETURN json_build_object('has_plan', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. [NEW] RPC: Get Store Effective Plan (Convenience Wrapper)
CREATE OR REPLACE FUNCTION get_store_effective_plan(p_store_id UUID)
RETURNS JSON AS $$
DECLARE
    v_owner_id UUID;
BEGIN
    SELECT owner_id INTO v_owner_id FROM stores WHERE id = p_store_id;
    RETURN get_owner_effective_plan(v_owner_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
