-- Update the check constraint for store_members role
-- Previous constraint only allowed: 'owner', 'admin', 'staff'
-- New application logic uses: 'owner', 'admin', 'editor', 'support'

ALTER TABLE public.store_members DROP CONSTRAINT IF EXISTS store_members_role_check;

ALTER TABLE public.store_members ADD CONSTRAINT store_members_role_check 
  CHECK (role IN ('owner', 'admin', 'editor', 'support', 'staff'));

-- Also update store_invitations if it has a similar constraint
-- (Checking if store_invitations has a constraint, usually good practice to keep them in sync)
-- Assuming store_invitations might not have it or it might be loose, but let's be safe if it exists.
-- But first, let's just fix the reported error on store_members.
