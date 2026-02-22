-- Migration to fix WhatsApp verification not confirming email and auto-activating referred stores

-- 1. Fix WhatsApp / Email OTP verification to forcibly confirm the user in auth.users
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

    -- FORCE UPDATE auth.users (fixes Supabase JS bug where email_confirm: true silently fails)
    -- As this is a SECURITY DEFINER function, it can safely update auth.users
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
        phone_confirmed_at = COALESCE(phone_confirmed_at, now()),
        updated_at = now()
    WHERE id = p_user_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Verification successful'
    );
END;
$$;


-- 2. Modify handle_new_user to auto-activate referred stores with the free plan
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_store_name TEXT;
  v_store_slug TEXT;
  v_store_id UUID;
  v_referral_code TEXT;
  v_referred_by_id UUID := NULL;
  v_initial_balance DECIMAL(12,2) := 0.00;
  v_free_plan_id UUID;
  v_initial_status TEXT := 'pending_plan';
BEGIN
  -- Create Profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name'
  );

  -- Create User Role (Merchant)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'merchant');

  -- Create Store logic
  v_store_name := NEW.raw_user_meta_data->>'store_name';
  v_store_slug := NEW.raw_user_meta_data->>'store_slug';
  v_referral_code := NEW.raw_user_meta_data->>'referral_code';

  IF v_store_name IS NOT NULL AND v_store_slug IS NOT NULL THEN
      -- Interpret referral code if provided
      IF v_referral_code IS NOT NULL AND v_referral_code != '' THEN
          SELECT id INTO v_referred_by_id FROM public.stores WHERE referral_code = v_referral_code LIMIT 1;
          
          -- If valid referral code found, grant the new store $2.00
          IF v_referred_by_id IS NOT NULL THEN
              v_initial_balance := 2.00;
              v_initial_status := 'active'; -- Auto-activate referred stores
          END IF;
      END IF;

      -- Insert Store
      INSERT INTO public.stores (owner_id, name, slug, status, balance, referred_by_store_id)
      VALUES (
        NEW.id, 
        jsonb_build_object('en', v_store_name, 'ar', v_store_name),
        v_store_slug,
        v_initial_status,
        v_initial_balance,
        v_referred_by_id
      ) RETURNING id INTO v_store_id;

      -- Add owner to store_members
      INSERT INTO public.store_members (store_id, user_id, role)
      VALUES (v_store_id, NEW.id, 'owner');

      -- If referral was successful, record the $2 deposit and AUTO-SUBSCRIBE to free plan
      IF v_referred_by_id IS NOT NULL THEN
          -- 1. Deposit $2
          INSERT INTO public.wallet_transactions (store_id, amount, type, description)
          VALUES (
              v_store_id, 
              2.00, 
              'deposit', 
              'Referral Welcome Bonus / مكافأة ترحيبية عبر دعوة'
          );

          -- 2. Find Free Plan (cheapest plan)
          SELECT id INTO v_free_plan_id FROM public.plans ORDER BY price ASC LIMIT 1;
          
          -- 3. Auto-subscribe to the free plan
          IF v_free_plan_id IS NOT NULL THEN
              INSERT INTO public.store_subscriptions (store_id, plan_id, status, current_period_start, current_period_end)
              VALUES (
                  v_store_id,
                  v_free_plan_id,
                  'active',
                  now(),
                  now() + interval '10 years' -- effectively lifetime for free plan
              );
          END IF;
      END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
