-- Migration: Add is_viewed and is_synced to orders table
-- Description: Supports new order badges and google sheet sync tracking

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_viewed BOOLEAN DEFAULT false;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT false;

-- Create an index for faster filtering of un-synced or un-viewed orders
CREATE INDEX IF NOT EXISTS idx_orders_is_synced ON public.orders(is_synced);
CREATE INDEX IF NOT EXISTS idx_orders_is_viewed ON public.orders(is_viewed);
