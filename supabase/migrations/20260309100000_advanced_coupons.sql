-- Migration to add advanced coupon features: limits and targets
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS max_per_customer INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS target_products UUID[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS target_categories UUID[] DEFAULT NULL;

-- Update the Supabase types down the line
