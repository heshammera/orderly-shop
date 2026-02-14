-- 1. Add Resend Tracking Columns to Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_resend_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_last_resend TIMESTAMP WITH TIME ZONE;

-- 2. RPC: Check Resend Eligibility (Security Layer)
CREATE OR REPLACE FUNCTION public.check_resend_eligibility()
RETURNS JSON AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_profile RECORD;
    v_limit INT := 3; -- Max resends per 24 hours
    v_window INTERVAL := '24 hours';
BEGIN
    -- Check if user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get Profile Data
    SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;

    -- Reset Counter if Window Passed
    IF v_profile.email_last_resend IS NULL OR (NOW() - v_profile.email_last_resend) > v_window THEN
        UPDATE public.profiles 
        SET email_resend_count = 1, email_last_resend = NOW() 
        WHERE id = v_user_id;
        
        RETURN json_build_object('success', true, 'remaining', v_limit - 1);
    END IF;

    -- Check Limit
    IF v_profile.email_resend_count >= v_limit THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'limit_exceeded',
            'message', 'You have reached the maximum number of resend attempts for today. Please try again later.'
        );
    END IF;

    -- Increment Counter
    UPDATE public.profiles 
    SET email_resend_count = email_resend_count + 1, email_last_resend = NOW() 
    WHERE id = v_user_id;

    RETURN json_build_object('success', true, 'remaining', v_limit - (v_profile.email_resend_count + 1));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
