-- Create a secure function to look up store ID by slug
-- This passes SECURITY DEFINER to bypass RLS, allowing middleware to find the store
-- regardless of its status (pending, banned, etc.) or user authentication state.
-- We ONLY return the ID to minimize data leakage.

CREATE OR REPLACE FUNCTION public.get_store_id_by_slug(p_slug TEXT)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id
    FROM public.stores
    WHERE slug = p_slug
    LIMIT 1;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.get_store_id_by_slug(TEXT) TO anon, authenticated, service_role;
