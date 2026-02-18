-- Update approve_recharge_request to credit balance in USD
CREATE OR REPLACE FUNCTION public.approve_recharge_request(request_id UUID)
RETURNS void AS $$
DECLARE
    req RECORD;
BEGIN
    -- Get request details
    SELECT * INTO req 
    FROM public.wallet_recharge_requests 
    WHERE id = request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recharge request not found or already processed';
    END IF;
    
    -- Credit the store balance with amount_usd instead of amount_local
    -- This standardizes the balance to be in USD
    UPDATE public.stores
    SET balance = COALESCE(balance, 0) + req.amount_usd,
        updated_at = NOW()
    WHERE id = req.store_id;
    
    -- Update request status
    UPDATE public.wallet_recharge_requests
    SET status = 'approved',
        updated_at = NOW()
    WHERE id = request_id;
    
    -- Create transaction record
    INSERT INTO public.wallet_transactions (
        store_id,
        amount,
        type,
        reference_id,
        description
    ) VALUES (
        req.store_id,
        req.amount_usd, -- Store transaction amount in USD
        'recharge',
        request_id,
        'Wallet recharge approved: $' || req.amount_usd || ' USD'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
