-- ============================================
-- Update RPC: generate_otp
-- Increase daily limit from 5 to 50 for testing
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_otp(
    p_user_id UUID,
    p_method TEXT,
    p_destination TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_code TEXT;
    v_daily_count INT;
    v_result JSON;
BEGIN
    -- Check daily limit (increased to 50)
    SELECT COUNT(*) INTO v_daily_count
    FROM public.verification_codes
    WHERE user_id = p_user_id
      AND created_at > now() - interval '24 hours';

    IF v_daily_count >= 50 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'daily_limit_exceeded',
            'message', 'Maximum 50 verification codes per day'
        );
    END IF;

    -- Invalidate any existing unused codes for this user
    UPDATE public.verification_codes
    SET expires_at = now()
    WHERE user_id = p_user_id
        AND verified_at IS NULL
        AND expires_at > now();

    -- Generate 6-digit code
    v_code := lpad(floor(random() * 1000000)::text, 6, '0');

    -- Insert new code (expires in 5 minutes)
    INSERT INTO public.verification_codes (user_id, code, method, destination, expires_at)
    VALUES (p_user_id, v_code, p_method, p_destination, now() + interval '5 minutes');

    RETURN json_build_object(
        'success', true,
        'code', v_code,
        'expires_in', 300
    );
END;
$$;
