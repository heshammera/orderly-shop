-- إذا كانت is_store_member غير موجودة، نفذ هذا لإنشائها:

CREATE OR REPLACE FUNCTION public.is_store_member(_user_id UUID, _store_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.store_members
    WHERE store_members.user_id = _user_id
      AND store_members.store_id = _store_id
  );
END;
$$;
