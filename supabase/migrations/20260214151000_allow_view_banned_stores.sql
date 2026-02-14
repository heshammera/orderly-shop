-- Allow owners to view their own stores regardless of status
-- This ensures that if a store is banned, the owner can still see the status page instead of a 404 error.

BEGIN;

-- 1. Ensure RLS is enabled (just effectively)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 2. Drop potential conflicting policies (if any exists that explicitly DENY, though typically policies are permissive)
-- However, we will create a new policy that is broad.

-- Check if policy exists and drop it to recreate it cleanly?
-- Since we don't know the exact name, we can just create a new one with a unique name.
-- "Owners can view their own stores" is the standard name.

DROP POLICY IF EXISTS "Owners can view their own stores" ON public.stores;

CREATE POLICY "Owners can view their own stores"
ON public.stores
FOR SELECT
TO authenticated
USING (
    auth.uid() = owner_id
);

-- We also need to ensure they can UPDATE? No, likely not if banned.
-- But the issue is viewing the status page.

COMMIT;
