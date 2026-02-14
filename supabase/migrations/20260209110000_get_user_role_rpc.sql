-- Create a function to get the current user's role in a store efficiently
-- This combines the check for owner and store_members in one call
CREATE OR REPLACE FUNCTION get_user_role(p_store_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role text;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    -- 1. Check if the user is the owner of the store
    SELECT 'owner' INTO v_role
    FROM public.stores
    WHERE id = p_store_id AND owner_id = v_user_id;
    
    IF v_role IS NOT NULL THEN
        RETURN v_role;
    END IF;

    -- 2. Check if the user is a member of the store
    SELECT role::text INTO v_role
    FROM public.store_members
    WHERE store_id = p_store_id AND user_id = v_user_id;

    RETURN v_role; -- Will be null if not found
END;
$$;
