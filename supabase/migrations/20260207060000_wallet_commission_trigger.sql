-- Function to handle commission deduction on new order
CREATE OR REPLACE FUNCTION public.handle_new_order_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_commission_type TEXT;
    v_commission_value DECIMAL(10,2);
    v_has_unlimited_balance BOOLEAN;
    v_commission_amount DECIMAL(12,2);
    v_store_name TEXT;
BEGIN
    -- Get store commission settings
    SELECT commission_type, commission_value, has_unlimited_balance, name
    INTO v_commission_type, v_commission_value, v_has_unlimited_balance, v_store_name
    FROM public.stores
    WHERE id = NEW.store_id;

    -- If store has unlimited balance, skip commission deduction logic
    -- OR we can still log it but not deduct? For now, let's skip affecting balance.
    -- But usually platforms want to track revenue even from VIPs. 
    -- Let's stick to the requirement: "Unlimited Balance" implies they don't run out.
    -- We will logically treating it as "Exempt" from blocking, but maybe we should still deduct?
    -- The user request was "Don't make them wait for request or make them infinite balance".
    -- If infinite, we probably don't care about their balance going negative. 
    -- However, for better tracking, let's deduct it anyway, but their balance logic checks might ignore negatives in the future.
    -- Actually, if "Unlimited", let's typically NOT deduct to avoid confusion of "Why is my infinite balance -500?".
    IF v_has_unlimited_balance THEN
        RETURN NEW;
    END IF;

    -- Calculate Commission
    IF v_commission_type = 'percentage' THEN
        v_commission_amount := (NEW.total * v_commission_value) / 100;
    ELSE
        v_commission_amount := v_commission_value;
    END IF;

    -- Ensure commission is valid
    IF v_commission_amount > 0 THEN
        -- 1. Deduct from Store Balance
        UPDATE public.stores
        SET balance = balance - v_commission_amount
        WHERE id = NEW.store_id;

        -- 2. Log Transaction
        INSERT INTO public.wallet_transactions (
            store_id,
            amount,
            type,
            reference_id,
            description,
            created_at
        ) VALUES (
            NEW.store_id,
            -v_commission_amount, -- Negative for deduction
            'commission',
            NEW.id,
            'Commission for Order #' || NEW.order_number,
            now()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after order creation
DROP TRIGGER IF EXISTS on_order_created_commission ON public.orders;
CREATE TRIGGER on_order_created_commission
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_order_commission();

-- RPC Function to safely increment store balance (for Admin Recharges)
CREATE OR REPLACE FUNCTION increment_store_balance(store_id_input UUID, amount_input DECIMAL)
RETURNS void AS $$
BEGIN
    UPDATE public.stores
    SET balance = balance + amount_input
    WHERE id = store_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
