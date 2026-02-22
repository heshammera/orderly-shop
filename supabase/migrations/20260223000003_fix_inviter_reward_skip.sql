-- Migration to fix the $5 Inviter Reward skipping due to Hotfix 1

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
      -- Interpret referral code if provided (make it case insensitive and trim spaces)
      IF v_referral_code IS NOT NULL AND BTRIM(v_referral_code) != '' THEN
          SELECT id INTO v_referred_by_id 
          FROM public.stores 
          WHERE UPPER(referral_code) = UPPER(BTRIM(v_referral_code)) 
          LIMIT 1;
          
          -- If valid referral code found, grant the new store $2.00
          IF v_referred_by_id IS NOT NULL THEN
              v_initial_balance := 2.00;
              v_initial_status := 'active'; -- Auto-activate referred stores
          END IF;
      END IF;

      -- Insert Store
      INSERT INTO public.stores (
        owner_id, name, slug, status, balance, referred_by_store_id, referral_reward_paid
      )
      VALUES (
        NEW.id, 
        jsonb_build_object('en', v_store_name, 'ar', v_store_name),
        v_store_slug,
        v_initial_status,
        v_initial_balance,
        v_referred_by_id,
        (CASE WHEN v_initial_status = 'active' AND v_referred_by_id IS NOT NULL THEN true ELSE false END)
      ) RETURNING id INTO v_store_id;

      -- Add owner to store_members
      INSERT INTO public.store_members (store_id, user_id, role)
      VALUES (v_store_id, NEW.id, 'owner');

      -- If referral was successful, record the deposits and AUTO-SUBSCRIBE
      IF v_referred_by_id IS NOT NULL THEN
          -- 1. Deposit $2 to the NEW STORE
          INSERT INTO public.wallet_transactions (store_id, amount, type, description)
          VALUES (
              v_store_id, 
              2.00, 
              'deposit', 
              'Referral Welcome Bonus / مكافأة ترحيبية عبر دعوة'
          );

          -- 2. Find Free Plan (cheapest plan usually 0, or lowest price)
          SELECT id INTO v_free_plan_id FROM public.plans ORDER BY price_monthly ASC NULLS LAST LIMIT 1;
          
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

          -- 4. Reward the INVITER immediately since the status was set to 'active' on insert
          IF v_initial_status = 'active' THEN
             -- Add $5 to the Inviter's Store Balance
             UPDATE public.stores
             SET balance = COALESCE(balance, 0) + 5.00
             WHERE id = v_referred_by_id;

             -- Log the transaction for the Inviter
             INSERT INTO public.wallet_transactions (store_id, amount, type, description)
             VALUES (
                 v_referred_by_id,
                 5.00,
                 'deposit',
                 'Referral Reward / مكافأة دعوة تاجر'
             );
          END IF;
      END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
