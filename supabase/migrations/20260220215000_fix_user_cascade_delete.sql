-- Fix missing ON DELETE CASCADE for foreign keys referencing auth.users 
-- to allow successful user deletion from the admin dashboard.

-- 1. Fix subscription_requests
ALTER TABLE IF EXISTS public.subscription_requests
DROP CONSTRAINT IF EXISTS subscription_requests_user_id_fkey;

ALTER TABLE IF EXISTS public.subscription_requests
ADD CONSTRAINT subscription_requests_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Fix affiliates
ALTER TABLE IF EXISTS public.affiliates
DROP CONSTRAINT IF EXISTS affiliates_user_id_fkey;

ALTER TABLE IF EXISTS public.affiliates
ADD CONSTRAINT affiliates_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
