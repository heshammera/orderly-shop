-- Add Advanced Settings columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS skip_cart boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS free_shipping boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fake_countdown_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fake_countdown_minutes integer DEFAULT 60,
ADD COLUMN IF NOT EXISTS fake_visitors_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fake_visitors_min integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS fake_visitors_max integer DEFAULT 50;

-- Add exact stock and price columns to variant_options table
ALTER TABLE variant_options
ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS manage_stock boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS price numeric(10, 2) DEFAULT NULL;

-- Keep in_stock for backward compatibility but allow null if not used
-- Remove the NOT NULL constraint if it exists (for safety)
ALTER TABLE variant_options ALTER COLUMN in_stock DROP NOT NULL;
