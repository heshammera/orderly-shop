-- Create is_store_member function which is used in RLS policies
-- We cannot DROP because of dependencies, so we replace keeping the parameter names compatible
CREATE OR REPLACE FUNCTION public.is_store_member(_user_id uuid, _store_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if user is a member of the store
  IF EXISTS (
    SELECT 1
    FROM public.store_members sm
    WHERE sm.store_id = _store_id
      AND sm.user_id = _user_id
  ) THEN
    RETURN true;
  END IF;

  -- Check if user is the owner of the store
  IF EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.id = _store_id
      AND s.owner_id = _user_id
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
