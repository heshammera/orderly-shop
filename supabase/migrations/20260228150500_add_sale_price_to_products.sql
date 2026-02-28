-- Add sale_price column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS sale_price numeric(10, 2) DEFAULT NULL;
