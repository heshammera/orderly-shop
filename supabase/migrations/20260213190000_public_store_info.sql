-- Secure RPC to get public store info by slug
-- Necessary for Login Page to render store name/logo even if store is pending/banned
-- and user is not logged in yet.

CREATE OR REPLACE FUNCTION public.get_store_public_info(p_slug TEXT)
RETURNS TABLE (
    id UUID,
    name JSONB,
    logo_url TEXT,
    slug TEXT,
    status TEXT,
    owner_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.logo_url,
        s.slug,
        s.status,
        s.owner_id
    FROM public.stores s
    WHERE s.slug = p_slug
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION public.get_store_public_info(TEXT) TO anon, authenticated, service_role;
