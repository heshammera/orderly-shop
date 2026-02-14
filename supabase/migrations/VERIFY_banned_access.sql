-- Verification Script for Banned Store Access
BEGIN;

DO $$
DECLARE
    v_user_id UUID;
    v_store_id UUID;
    v_count INT;
BEGIN
    RAISE NOTICE 'Starting Banned Store Access Verification...';

    -- 1. Create User
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, aud, role) 
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'banned_test@example.com', 'authenticated', 'authenticated');

    -- 2. Create Banned Store
    INSERT INTO public.stores (owner_id, name, slug, status, status_reason)
    VALUES (v_user_id, '{"en": "Banned Store"}'::jsonb, 'banned-test', 'banned', 'Violation of terms')
    RETURNING id INTO v_store_id;

    RAISE NOTICE 'Created User % and Banned Store %', v_user_id, v_store_id;

    -- 3. Switch to User Context and Try to Select
    -- We can't easily switch user in DO block without SET LOCAL ROLE, but RLS in Supabase works by checking auth.uid()
    -- We can simulate by setting config variable that our policies use, usually 'request.jwt.claim.sub'
    
    -- NOTE: In standard Postgres RLS testing, we set the session variable.
    -- Assuming policies use auth.uid() which wraps current_setting('request.jwt.claim.sub', true)
    
    PERFORM set_config('request.jwt.claim.sub', v_user_id::text, true);
    PERFORM set_config('role', 'authenticated', true);

    SELECT COUNT(*) INTO v_count FROM public.stores WHERE id = v_store_id;

    IF v_count = 1 THEN
        RAISE NOTICE 'SUCCESS: Owner CAN view their banned store.';
    ELSE
        RAISE EXCEPTION 'FAILURE: Owner CANNOT view their banned store (Count: %). RLS is likely blocking it.', v_count;
    END IF;

END $$;

ROLLBACK;
