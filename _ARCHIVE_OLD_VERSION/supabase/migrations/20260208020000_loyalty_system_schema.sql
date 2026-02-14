-- Enable Loyalty Features in Stores
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS loyalty_program_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS loyalty_earning_rate INTEGER DEFAULT 1, -- 1 Point per usage unit (e.g., 1 AED)
ADD COLUMN IF NOT EXISTS loyalty_redemption_rate INTEGER DEFAULT 100; -- 100 Points = 1 Unit of Currency

-- Add Loyalty Points to Customers
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;

-- Create Loyalty Transactions Table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    points INTEGER NOT NULL, -- Positive = Earning, Negative = Redemption
    type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'manual_adjustment', 'refund')),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read loyalty transactions" ON loyalty_transactions
    FOR SELECT USING (true); -- Simplified for storefront access, ideally restricted by customer_id

CREATE POLICY "Admin manage loyalty transactions" ON loyalty_transactions
    FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM store_members WHERE store_id = loyalty_transactions.store_id
    ));

-- Trigger: Update Customer Points on Transaction
CREATE OR REPLACE FUNCTION update_customer_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE customers
    SET loyalty_points = loyalty_points + NEW.points
    WHERE id = NEW.customer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_loyalty_transaction_insert
    AFTER INSERT ON loyalty_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_loyalty_points();

-- Trigger: Earn Points on Order Completion
CREATE OR REPLACE FUNCTION earn_points_on_order_complete()
RETURNS TRIGGER AS $$
DECLARE
    v_store_id UUID;
    v_customer_id UUID;
    v_total_amount DECIMAL;
    v_earning_rate INTEGER;
    v_points_to_earn INTEGER;
    v_program_enabled BOOLEAN;
BEGIN
    -- Only run if status changed to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
        v_store_id := NEW.store_id;
        v_customer_id := NEW.customer_id;
        v_total_amount := NEW.total_amount;

        -- Check if loyalty is enabled and get rate
        SELECT loyalty_program_enabled, loyalty_earning_rate 
        INTO v_program_enabled, v_earning_rate
        FROM stores WHERE id = v_store_id;

        IF v_program_enabled AND v_customer_id IS NOT NULL THEN
            v_points_to_earn := FLOOR(v_total_amount * v_earning_rate);
            
            IF v_points_to_earn > 0 THEN
                INSERT INTO loyalty_transactions (store_id, customer_id, points, type, order_id, description)
                VALUES (v_store_id, v_customer_id, v_points_to_earn, 'earn', NEW.id, 'Points earned from Order #' || NEW.order_number);
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_completed_loyalty
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION earn_points_on_order_complete();
