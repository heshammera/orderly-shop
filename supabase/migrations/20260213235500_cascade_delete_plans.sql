-- Update store_subscriptions FK to Cascade Delete
ALTER TABLE public.store_subscriptions
DROP CONSTRAINT IF EXISTS store_subscriptions_plan_id_fkey;

ALTER TABLE public.store_subscriptions
ADD CONSTRAINT store_subscriptions_plan_id_fkey
FOREIGN KEY (plan_id)
REFERENCES public.plans(id)
ON DELETE CASCADE;

-- Update subscription_requests FK to Cascade Delete
ALTER TABLE public.subscription_requests
DROP CONSTRAINT IF EXISTS subscription_requests_plan_id_fkey;

ALTER TABLE public.subscription_requests
ADD CONSTRAINT subscription_requests_plan_id_fkey
FOREIGN KEY (plan_id)
REFERENCES public.plans(id)
ON DELETE CASCADE;
