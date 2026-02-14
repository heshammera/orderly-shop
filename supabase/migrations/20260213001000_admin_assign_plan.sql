-- RPC: Admin Assign Plan to Store
CREATE OR REPLACE FUNCTION admin_assign_store_plan(
    p_store_id UUID,
    p_plan_id UUID,
    p_period_days INT DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
    v_sub_id UUID;
BEGIN
    -- Deactivate old active subscriptions
    UPDATE store_subscriptions
    SET status = 'canceled', canceled_at = NOW()
    WHERE store_id = p_store_id AND status = 'active';

    -- Create new subscription
    INSERT INTO store_subscriptions (
        store_id,
        plan_id,
        status,
        starts_at,
        current_period_end
    ) VALUES (
        p_store_id,
        p_plan_id,
        'active',
        NOW(),
        NOW() + (p_period_days || ' days')::INTERVAL
    ) RETURNING id INTO v_sub_id;

    RETURN json_build_object('success', true, 'subscription_id', v_sub_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
