-- Verification Script for Subscription Downgrade Logic

BEGIN;

-- 1. Setup Test Data
DO $$
DECLARE
    v_user_id UUID;
    v_store1_id UUID;
    v_store2_id UUID;
    v_basic_plan_id UUID;
    v_pro_plan_id UUID;
    v_req_id UUID;
    v_check_result JSON;
BEGIN
    RAISE NOTICE 'Starting Verification...';

    -- Create Fake User (with ID)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, aud, role) 
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'test_downgrade@example.com', 'authenticated', 'authenticated');
    
    -- Create Plans
    -- Updated to include 'name' column (JSONB)
    INSERT INTO public.plans (name, name_en, name_ar, slug, price_monthly, features)
    VALUES 
    ('{"en": "Basic Plan", "ar": "Basic"}'::jsonb, 'Basic Plan', 'Basic', 'basic-test', 100, '{"stores_limit": 1, "orders_limit": 10}'::jsonb)
    RETURNING id INTO v_basic_plan_id;

    INSERT INTO public.plans (name, name_en, name_ar, slug, price_monthly, features)
    VALUES 
    ('{"en": "Pro Plan", "ar": "Pro"}'::jsonb, 'Pro Plan', 'Pro', 'pro-test', 200, '{"stores_limit": 5, "orders_limit": 100}'::jsonb)
    RETURNING id INTO v_pro_plan_id;

    -- Create 2 Stores (Active)
    -- Updated to use JSONB for 'name'
    INSERT INTO public.stores (owner_id, name, slug, status)
    VALUES (v_user_id, '{"en": "Store 1", "ar": "Store 1"}'::jsonb, 'store-1-test', 'active')
    RETURNING id INTO v_store1_id;

    INSERT INTO public.stores (owner_id, name, slug, status)
    VALUES (v_user_id, '{"en": "Store 2", "ar": "Store 2"}'::jsonb, 'store-2-test', 'active')
    RETURNING id INTO v_store2_id;

    RAISE NOTICE 'Created User %, Store1 %, Store2 %', v_user_id, v_store1_id, v_store2_id;

    -- 1.5 Test Account-Level Inheritance
    -- Give Store 1 a Pro Subscription
    INSERT INTO public.store_subscriptions (store_id, plan_id, status, current_period_end)
    VALUES (v_store1_id, v_pro_plan_id, 'active', NOW() + interval '1 year');

    RAISE NOTICE 'Testing Account-Level Inheritance (Store 2 should see Store 1 Pro Plan)...';
    SELECT get_store_effective_plan(v_store2_id) INTO v_check_result;
    
    IF (v_check_result->>'has_plan')::boolean = true AND (v_check_result->'plan'->>'id')::uuid = v_pro_plan_id THEN
        RAISE NOTICE 'SUCCESS: Store 2 inherited Pro Plan from Store 1.';
    ELSE
        RAISE EXCEPTION 'FAILURE: Store 2 did not inherit plan. Result: %', v_check_result;
    END IF;

    -- 2. Test Conflict Detection (Downgrade to Basic)
    -- Try to switch Store 1 to Basic Plan (Limit 1). User has 2 active stores. Should Conflict.
    RAISE NOTICE 'Testing Conflict Detection...';
    
    SELECT check_plan_downgrade_impact(v_store1_id, v_basic_plan_id) INTO v_check_result;
    
    IF (v_check_result->>'status') = 'conflict' THEN
        RAISE NOTICE 'SUCCESS: Conflict detected correctly. Details: %', v_check_result;
    ELSE
        RAISE EXCEPTION 'FAILURE: Expected conflict but got %', v_check_result;
    END IF;

    -- 3. Test Approval with Resolution
    -- Create Request
    INSERT INTO public.subscription_requests (store_id, plan_id, user_id, amount, payment_method, status)
    VALUES (v_store1_id, v_basic_plan_id, v_user_id, 100, 'bank_transfer', 'pending')
    RETURNING id INTO v_req_id;

    -- Approve keeping Store 1 only. Store 2 should be suspended.
    RAISE NOTICE 'Testing Approval with Keep List (Keep Store 1)...';
    PERFORM approve_subscription_request(v_req_id, ARRAY[v_store1_id]);

    -- Verify Store 1 is Active, Store 2 is Suspended
    IF EXISTS (SELECT 1 FROM stores WHERE id = v_store1_id AND status = 'active') AND
       EXISTS (SELECT 1 FROM stores WHERE id = v_store2_id AND status = 'suspended') THEN
        RAISE NOTICE 'SUCCESS: Store 1 Active, Store 2 Suspended.';
    ELSE
         RAISE EXCEPTION 'FAILURE: Store statuses incorrect. Store1: %, Store2: %', 
            (SELECT status FROM stores WHERE id = v_store1_id),
            (SELECT status FROM stores WHERE id = v_store2_id);
    END IF;

    -- Verify Subscription Period Reset
    IF EXISTS (SELECT 1 FROM store_subscriptions WHERE store_id = v_store1_id AND current_period_start >= (NOW() - interval '1 minute')) THEN
        RAISE NOTICE 'SUCCESS: Subscription period reset.';
    ELSE
         RAISE EXCEPTION 'FAILURE: Subscription period start not reset.';
    END IF;

    RAISE NOTICE 'ALL TESTS PASSED';
END $$;

ROLLBACK; -- Always rollback to clean up
