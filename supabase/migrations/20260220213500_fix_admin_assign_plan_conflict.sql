-- Fix: Admin Assign Plan to Store (Handle existing unique store_id)
CREATE OR REPLACE FUNCTION admin_assign_store_plan(
    p_store_id UUID,
    p_plan_id UUID,
    p_period_days INT DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
    v_sub_id UUID;
BEGIN
    -- Upsert the subscription since store_id is unique
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
    )
    ON CONFLICT (store_id) DO UPDATE SET
        plan_id = EXCLUDED.plan_id,
        status = 'active',
        starts_at = EXCLUDED.starts_at,
        current_period_end = EXCLUDED.current_period_end
    RETURNING id INTO v_sub_id;

    RETURN json_build_object('success', true, 'subscription_id', v_sub_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
