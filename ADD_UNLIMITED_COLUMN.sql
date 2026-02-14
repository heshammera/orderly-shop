
-- Add has_unlimited_balance column to stores table if it doesn't exist
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS has_unlimited_balance BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.stores.has_unlimited_balance IS 'If true, this store is exempt from balance restrictions even if balance is <= 0';
