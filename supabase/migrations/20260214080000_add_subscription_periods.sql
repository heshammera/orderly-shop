
-- Add period columns to store_subscriptions
ALTER TABLE public.store_subscriptions 
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Update existing rows with default values (assuming monthly cycle from starts_at)
UPDATE public.store_subscriptions
SET 
    current_period_start = starts_at,
    current_period_end = starts_at + interval '1 month'
WHERE current_period_start IS NULL;

-- Make them not null after population if desired? 
-- No, keep nullable for safety or draft subs. But preferably they should be set.
