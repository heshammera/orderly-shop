-- Create Affiliates Table
CREATE TABLE IF NOT EXISTS affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    code TEXT NOT NULL, -- The unique referral code (e.g., 'SALE20')
    commission_rate DECIMAL DEFAULT 10, -- Percentage
    total_earnings DECIMAL DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, code)
);

-- Create Affiliate Conversions Table
CREATE TABLE IF NOT EXISTS affiliate_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    amount DECIMAL NOT NULL, -- Order Total
    commission DECIMAL NOT NULL, -- Commission Earned
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add affiliate_code to Orders to track origin
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS affiliate_code TEXT;

-- Enable RLS
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;

-- Policies for Affiliates
CREATE POLICY "Admin manage affiliates" ON affiliates
    FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM store_members WHERE store_id = affiliates.store_id
    ));

CREATE POLICY "Public read affiliates by code" ON affiliates
    FOR SELECT USING (true); -- Needed to validate codes on storefront

-- Policies for Conversions
CREATE POLICY "Admin view conversions" ON affiliate_conversions
    FOR SELECT USING (auth.uid() IN (
        SELECT user_id FROM store_members WHERE store_id = affiliate_conversions.store_id
    ));

-- Trigger: Calculate Commission on Order Completion
CREATE OR REPLACE FUNCTION process_affiliate_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_affiliate_id UUID;
    v_commission_rate DECIMAL;
    v_commission_amount DECIMAL;
BEGIN
    -- Only run if status changed to 'completed' and has affiliate_code
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') AND NEW.affiliate_code IS NOT NULL THEN
        
        -- Find Affiliate
        SELECT id, commission_rate INTO v_affiliate_id, v_commission_rate
        FROM affiliates 
        WHERE store_id = NEW.store_id AND code = NEW.affiliate_code AND status = 'active';

        IF v_affiliate_id IS NOT NULL THEN
            -- Calculate Commission
            v_commission_amount := (NEW.subtotal * v_commission_rate) / 100;
            
            -- Record Conversion
            INSERT INTO affiliate_conversions (affiliate_id, store_id, order_id, amount, commission, status)
            VALUES (v_affiliate_id, NEW.store_id, NEW.id, NEW.subtotal, v_commission_amount, 'pending');

            -- Update Affiliate Earnings
            UPDATE affiliates
            SET total_earnings = total_earnings + v_commission_amount
            WHERE id = v_affiliate_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_completed_affiliate
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION process_affiliate_commission();
