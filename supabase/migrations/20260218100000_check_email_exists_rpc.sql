-- Create a function to check if an email exists in auth.users
-- This function is SECURITY DEFINER to bypass RLS, but we restrict access.

CREATE OR REPLACE FUNCTION public.check_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if email exists in auth.users
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE email = p_email 
  );
END;
$$;

-- IMPORTANT: Only allow service_role to execute this function
REVOKE ALL ON FUNCTION public.check_email_exists(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_email_exists(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.check_email_exists(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO service_role;
