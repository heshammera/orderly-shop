-- New RPC Function to securely update balance and log transaction together
CREATE OR REPLACE FUNCTION admin_recharge_wallet(
    p_store_id UUID,
    p_amount DECIMAL,
    p_type TEXT,
    p_description TEXT
)
RETURNS void AS $$
BEGIN
    -- Update balance
    UPDATE public.stores
    SET balance = balance + p_amount
    WHERE id = p_store_id;

    -- Log transaction
    INSERT INTO public.wallet_transactions (
        store_id,
        amount,
        type,
        description,
        created_at
    ) VALUES (
        p_store_id,
        p_amount,
        p_type,
        p_description,
        now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
