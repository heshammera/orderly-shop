-- ============================================
-- Verification Codes System for OTP (WhatsApp / Email)
-- ============================================

-- 1. Create the verification_codes table
CREATE TABLE IF NOT EXISTS public.verification_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('whatsapp', 'email')),
    destination TEXT NOT NULL, -- phone number or email
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    attempts INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_verification_codes_user_id ON public.verification_codes(user_id);
CREATE INDEX idx_verification_codes_code ON public.verification_codes(code);
CREATE INDEX idx_verification_codes_expires ON public.verification_codes(expires_at);

-- RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Users can only read their own codes (for display purposes only)
CREATE POLICY "Users can view own verification codes"
    ON public.verification_codes FOR SELECT
    USING (auth.uid() = user_id);

-- Service role handles inserts/updates via RPC
CREATE POLICY "Service role full access on verification_codes"
    ON public.verification_codes FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- 2. RPC: generate_otp
-- Generates a 6-digit code, valid for 5 minutes
-- Max 5 codes per user per day
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
    -- Check daily limit (max 5 per day)
    SELECT COUNT(*) INTO v_daily_count
    FROM public.verification_codes
    WHERE user_id = p_user_id
      AND created_at > now() - interval '24 hours';

    IF v_daily_count >= 5 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'daily_limit_exceeded',
            'message', 'Maximum 5 verification codes per day'
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

-- ============================================
-- 3. RPC: verify_otp
-- Validates the code, checks expiry, max 5 wrong attempts
-- ============================================
CREATE OR REPLACE FUNCTION public.verify_otp(
    p_user_id UUID,
    p_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_record RECORD;
BEGIN
    -- Find the latest non-expired, non-verified code for this user
    SELECT * INTO v_record
    FROM public.verification_codes
    WHERE user_id = p_user_id
      AND verified_at IS NULL
      AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1;

    -- No active code found
    IF v_record IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'no_active_code',
            'message', 'No active verification code found. Please request a new one.'
        );
    END IF;

    -- Check max attempts (5)
    IF v_record.attempts >= 5 THEN
        -- Expire the code
        UPDATE public.verification_codes
        SET expires_at = now()
        WHERE id = v_record.id;

        RETURN json_build_object(
            'success', false,
            'error', 'max_attempts_exceeded',
            'message', 'Too many failed attempts. Please request a new code.'
        );
    END IF;

    -- Increment attempts
    UPDATE public.verification_codes
    SET attempts = attempts + 1
    WHERE id = v_record.id;

    -- Check if code matches
    IF v_record.code != p_code THEN
        RETURN json_build_object(
            'success', false,
            'error', 'invalid_code',
            'message', 'Invalid verification code.',
            'attempts_remaining', 4 - v_record.attempts
        );
    END IF;

    -- Code is correct! Mark as verified
    UPDATE public.verification_codes
    SET verified_at = now()
    WHERE id = v_record.id;

    RETURN json_build_object(
        'success', true,
        'message', 'Verification successful'
    );
END;
$$;
