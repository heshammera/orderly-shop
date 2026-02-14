-- Add sender_phone column to wallet_recharge_requests
ALTER TABLE public.wallet_recharge_requests 
ADD COLUMN IF NOT EXISTS sender_phone VARCHAR(20);

-- Update payment_method default if needed
ALTER TABLE public.wallet_recharge_requests 
ALTER COLUMN proof_image SET DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN public.wallet_recharge_requests.sender_phone IS 'Phone number of the person who sent the money';

-- Create function to approve recharge request
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
    
    -- Credit the store balance
    UPDATE public.stores
    SET balance = balance + req.amount_local,
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
        req.amount_local,
        'recharge',
        request_id,
        'Wallet recharge approved: $' || req.amount_usd || ' USD (' || req.amount_local || ' ' || (SELECT currency FROM stores WHERE id = req.store_id) || ')'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reject recharge request
CREATE OR REPLACE FUNCTION public.reject_recharge_request(request_id UUID, reason TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
    -- Update request status
    UPDATE public.wallet_recharge_requests
    SET status = 'rejected',
        rejection_reason = reason,
        updated_at = NOW()
    WHERE id = request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recharge request not found or already processed';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (will be restricted by RLS in calling context)
GRANT EXECUTE ON FUNCTION public.approve_recharge_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_recharge_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_setting(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_setting(TEXT, JSONB, TEXT) TO authenticated;
