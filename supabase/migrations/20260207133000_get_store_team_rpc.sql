CREATE OR REPLACE FUNCTION get_store_team(p_store_id uuid)
RETURNS TABLE (
    member_id uuid,
    user_id uuid,
    role text,
    email varchar,
    full_name text,
    joined_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the requesting user is a member of the store
    IF NOT EXISTS (
        SELECT 1 FROM public.store_members AS sm_check
        WHERE sm_check.store_id = p_store_id 
        AND sm_check.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT 
        sm.id as member_id,
        sm.user_id as user_id,
        sm.role::text,
        au.email::varchar,
        -- Fallback to auth.users metadata if profile name is null
        COALESCE(p.full_name, (au.raw_user_meta_data->>'full_name'), 'User') as full_name,
        sm.created_at as joined_at
    FROM public.store_members sm
    JOIN auth.users au ON sm.user_id = au.id
    LEFT JOIN public.profiles p ON sm.user_id = p.id
    WHERE sm.store_id = p_store_id;
END;
$$;
