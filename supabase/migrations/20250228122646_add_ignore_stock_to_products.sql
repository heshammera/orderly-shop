-- Add ignore_stock column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS ignore_stock boolean DEFAULT false;
