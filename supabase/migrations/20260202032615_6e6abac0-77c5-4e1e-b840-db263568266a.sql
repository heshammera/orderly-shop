-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name JSONB NOT NULL DEFAULT '{"ar": "", "en": ""}'::jsonb,
  description JSONB DEFAULT '{"ar": "", "en": ""}'::jsonb,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  compare_at_price DECIMAL(10,2),
  sku TEXT,
  barcode TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  track_inventory BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name JSONB NOT NULL DEFAULT '{"ar": "", "en": ""}'::jsonb,
  description JSONB DEFAULT '{"ar": "", "en": ""}'::jsonb,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_categories junction table
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, category_id)
);

-- Create customers table (separate from users/merchants)
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  name TEXT,
  address JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table with snapshot support
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  customer_snapshot JSONB DEFAULT '{}'::jsonb,
  shipping_address JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table with product snapshot
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Products RLS policies
CREATE POLICY "Store members can view products"
  ON public.products FOR SELECT
  USING (is_store_member(auth.uid(), store_id));

CREATE POLICY "Store owners can manage products"
  ON public.products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()
  ));

-- Categories RLS policies
CREATE POLICY "Store members can view categories"
  ON public.categories FOR SELECT
  USING (is_store_member(auth.uid(), store_id));

CREATE POLICY "Store owners can manage categories"
  ON public.categories FOR ALL
  USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = categories.store_id AND stores.owner_id = auth.uid()
  ));

-- Product_categories RLS policies
CREATE POLICY "Store members can view product_categories"
  ON public.product_categories FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM products WHERE products.id = product_categories.product_id
    AND is_store_member(auth.uid(), products.store_id)
  ));

CREATE POLICY "Store owners can manage product_categories"
  ON public.product_categories FOR ALL
  USING (EXISTS (
    SELECT 1 FROM products 
    JOIN stores ON stores.id = products.store_id
    WHERE products.id = product_categories.product_id 
    AND stores.owner_id = auth.uid()
  ));

-- Customers RLS policies
CREATE POLICY "Store members can view customers"
  ON public.customers FOR SELECT
  USING (is_store_member(auth.uid(), store_id));

CREATE POLICY "Store owners can manage customers"
  ON public.customers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = customers.store_id AND stores.owner_id = auth.uid()
  ));

-- Orders RLS policies
CREATE POLICY "Store members can view orders"
  ON public.orders FOR SELECT
  USING (is_store_member(auth.uid(), store_id));

CREATE POLICY "Store owners can manage orders"
  ON public.orders FOR ALL
  USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()
  ));

-- Order_items RLS policies
CREATE POLICY "Store members can view order_items"
  ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id
    AND is_store_member(auth.uid(), orders.store_id)
  ));

CREATE POLICY "Store owners can manage order_items"
  ON public.order_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM orders 
    JOIN stores ON stores.id = orders.store_id
    WHERE orders.id = order_items.order_id 
    AND stores.owner_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_products_store_id ON public.products(store_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_categories_store_id ON public.categories(store_id);
CREATE INDEX idx_customers_store_id ON public.customers(store_id);
CREATE INDEX idx_orders_store_id ON public.orders(store_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- Add triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();