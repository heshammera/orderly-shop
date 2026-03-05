-- ============================================
-- Contact Change Requests with OTP Verification
-- ============================================

-- 1. Add verified flags to stores table
ALTER TABLE public.stores
    ADD COLUMN IF NOT EXISTS contact_email_verified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS contact_phone_verified BOOLEAN DEFAULT false;

-- 2. Create the contact_change_requests table
CREATE TABLE IF NOT EXISTS public.contact_change_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    field TEXT NOT NULL CHECK (field IN ('email', 'whatsapp')),
    new_value TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired')),
    created_at TIMESTAMPTZ DEFAULT now(),
    verified_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_contact_change_store ON public.contact_change_requests(store_id);
CREATE INDEX idx_contact_change_status ON public.contact_change_requests(status);

-- RLS
ALTER TABLE public.contact_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contact change requests"
    ON public.contact_change_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on contact_change_requests"
    ON public.contact_change_requests FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- 3. RPC: verify_contact_change
-- Verifies OTP and applies the contact change
-- ============================================
CREATE OR REPLACE FUNCTION public.verify_contact_change(
    p_user_id UUID,
    p_code TEXT,
    p_store_id UUID,
    p_field TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_otp_result JSON;
    v_request RECORD;
BEGIN
    -- 1. Verify the OTP code first
    SELECT * INTO v_otp_result FROM public.verify_otp(p_user_id, p_code);

    -- Check if OTP verification succeeded
    IF NOT (v_otp_result->>'success')::boolean THEN
        RETURN v_otp_result; -- Return the error from verify_otp
    END IF;

    -- 2. Find the latest pending change request for this store + field
    SELECT * INTO v_request
    FROM public.contact_change_requests
    WHERE store_id = p_store_id
      AND user_id = p_user_id
      AND field = p_field
      AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_request IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'no_pending_request',
            'message', 'No pending contact change request found.'
        );
    END IF;

    -- 3. Apply the change to the stores table
    IF p_field = 'email' THEN
        UPDATE public.stores
        SET contact_email = v_request.new_value,
            contact_email_verified = true
        WHERE id = p_store_id;
    ELSIF p_field = 'whatsapp' THEN
        UPDATE public.stores
        SET contact_phone = v_request.new_value,
            contact_phone_verified = true
        WHERE id = p_store_id;
    END IF;

    -- 4. Mark the request as verified
    UPDATE public.contact_change_requests
    SET status = 'verified',
        verified_at = now()
    WHERE id = v_request.id;

    -- 5. Expire any other pending requests for this store + field
    UPDATE public.contact_change_requests
    SET status = 'expired'
    WHERE store_id = p_store_id
      AND field = p_field
      AND status = 'pending'
      AND id != v_request.id;

    RETURN json_build_object(
        'success', true,
        'message', 'Contact updated and verified successfully',
        'new_value', v_request.new_value
    );
END;
$$;
