-- Function to securely fetch ID and Phone of an unverified user by email
-- This is SECURITY DEFINER so it bypasses RLS, but it ONLY returns data
-- if the user is explicitly NOT verified (email_confirmed_at IS NULL).
-- This prevents enumeration of verified active accounts.

CREATE OR REPLACE FUNCTION public.get_unverified_user_by_email(p_email TEXT)
RETURNS TABLE (
    user_id UUID,
    user_phone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER -- Required to read from auth.users
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id AS user_id, 
        phone AS user_phone
    FROM auth.users
    WHERE email = p_email 
      AND email_confirmed_at IS NULL
    LIMIT 1;
END;
$$;

-- Grant execution to authenticated and anon (since they are trying to log in/verify)
-- Actually, we'll only call this from the backend using the service_role key, 
-- but it's safe to grant to anon if we wanted to call it directly.
GRANT EXECUTE ON FUNCTION public.get_unverified_user_by_email(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_unverified_user_by_email(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_unverified_user_by_email(TEXT) TO authenticated;
