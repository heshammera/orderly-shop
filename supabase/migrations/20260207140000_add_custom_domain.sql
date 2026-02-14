-- Add custom_domain and domain_verified columns to stores table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS custom_domain text UNIQUE,
ADD COLUMN IF NOT EXISTS domain_verified boolean DEFAULT false;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stores_custom_domain ON public.stores(custom_domain);
