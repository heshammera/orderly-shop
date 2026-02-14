-- RPC: Approve Wallet Recharge
CREATE OR REPLACE FUNCTION approve_wallet_recharge(
    p_request_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_amount NUMERIC;
    v_store_id UUID;
    v_current_status TEXT;
BEGIN
    -- Get request details
    SELECT amount, store_id, status INTO v_amount, v_store_id, v_current_status
    FROM wallet_recharge_requests
    WHERE id = p_request_id;

    -- Validation
    IF v_current_status != 'pending' THEN
        RETURN json_build_object('success', false, 'message', 'Request is not pending');
    END IF;

    -- Update Request Status
    UPDATE wallet_recharge_requests
    SET status = 'approved', updated_at = NOW()
    WHERE id = p_request_id;

    -- Update Store Balance
    UPDATE stores
    SET balance = balance + v_amount, updated_at = NOW()
    WHERE id = v_store_id;

    -- Create Transaction Record
    INSERT INTO wallet_transactions (
        store_id,
        amount,
        type,
        reference_id,
        description,
        created_at
    ) VALUES (
        v_store_id,
        v_amount,
        'deposit',
        p_request_id::text,
        'Wallet Recharge (Approved by Admin)',
        NOW()
    );

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Reject Wallet Recharge
CREATE OR REPLACE FUNCTION reject_wallet_recharge(
    p_request_id UUID
)
RETURNS JSON AS $$
BEGIN
    UPDATE wallet_recharge_requests
    SET status = 'rejected', updated_at = NOW()
    WHERE id = p_request_id;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
