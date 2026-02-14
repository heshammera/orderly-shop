-- Create carts table
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    session_id TEXT, -- For guest carts or persistent sessions
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    variants JSONB DEFAULT '{}'::jsonb, -- Store selected options: { "variant_id": "option_id" }
    unit_price_at_addition NUMERIC(10, 2) NOT NULL, -- Snapshot of price (possibly discounted)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX idx_carts_store_id ON public.carts(store_id);
CREATE INDEX idx_carts_customer_id ON public.carts(customer_id);
CREATE INDEX idx_carts_session_id ON public.carts(session_id);
CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);

-- Enable RLS
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Policies for Carts
-- Customers can view/edit their own carts
CREATE POLICY "Customers can manage their own carts" ON public.carts
    FOR ALL
    USING (auth.uid() = customer_id)
    WITH CHECK (auth.uid() = customer_id);

-- Allow public access for session-based carts (handled via code/session_id mostly, but strictly for now let's allow public insert if store_id matches?)
-- For now, we might need a more open policy for guest carts if we strictly enforce RLS.
-- Let's allow public to create carts, but only access by ID/Session if we implement that logic securely.
-- Simplified for MVP: Allow all for now on carts if they have the UUID (or refine later). 
-- Actually, best practice: 
-- 1. Logged in: auth.uid() = customer_id.
-- 2. Guests: we verify session_id? Or just allow public insert and select by ID.
-- For simplicity in this phase:
CREATE POLICY "Public full access to carts" ON public.carts
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Policies for Cart Items
CREATE POLICY "Public full access to cart items" ON public.cart_items
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at_carts
    BEFORE UPDATE ON public.carts
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
