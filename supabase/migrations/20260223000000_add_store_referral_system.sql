-- ==========================================
-- REFERRAL SYSTEM MIGRATION
-- ==========================================

-- 1. Add referral columns to stores table
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS referred_by_store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS referral_reward_paid BOOLEAN NOT NULL DEFAULT false;

-- 2. Create function to generate unique random referral code
CREATE OR REPLACE FUNCTION public.generate_store_referral_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate random like REF-A1B2C3
        new_code := 'REF-' || upper(substring(md5(random()::text) from 1 for 6));
        
        SELECT EXISTS(SELECT 1 FROM public.stores WHERE referral_code = new_code) INTO code_exists;
        
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger function to automatically set referral code on new stores BEFORE INSERT
CREATE OR REPLACE FUNCTION public.trigger_set_store_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := public.generate_store_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_store_insert_set_referral_code ON public.stores;
CREATE TRIGGER on_store_insert_set_referral_code
    BEFORE INSERT ON public.stores
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_store_referral_code();

-- 4. Backfill existing stores that don't have a referral code
DO $$
DECLARE
    store_rec RECORD;
BEGIN
    FOR store_rec IN SELECT id FROM public.stores WHERE referral_code IS NULL LOOP
        UPDATE public.stores
        SET referral_code = public.generate_store_referral_code()
        WHERE id = store_rec.id;
    END LOOP;
END $$;


-- 5. Modify handle_new_user to capture referral_code from user_metadata and grant $2 bonus
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_store_name TEXT;
  v_store_slug TEXT;
  v_store_id UUID;
  v_referral_code TEXT;
  v_referred_by_id UUID := NULL;
  v_initial_balance DECIMAL(12,2) := 0.00;
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
          END IF;
      END IF;

      -- Insert Store
      INSERT INTO public.stores (owner_id, name, slug, status, balance, referred_by_store_id)
      VALUES (
        NEW.id, 
        jsonb_build_object('en', v_store_name, 'ar', v_store_name),
        v_store_slug,
        'pending_plan',
        v_initial_balance,
        v_referred_by_id
      ) RETURNING id INTO v_store_id;

      -- Add owner to store_members
      INSERT INTO public.store_members (store_id, user_id, role)
      VALUES (v_store_id, NEW.id, 'owner');

      -- If referral was successful, record the $2 deposit transaction to the new store's wallet
      IF v_referred_by_id IS NOT NULL THEN
          INSERT INTO public.wallet_transactions (store_id, amount, type, description)
          VALUES (
              v_store_id, 
              2.00, 
              'deposit', 
              'Referral Welcome Bonus / مكافأة ترحيبية عبر دعوة'
          );
      END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 6. Trigger to award the $5 bonus to the inviter when the new store pays for subscription
CREATE OR REPLACE FUNCTION public.trigger_referral_reward_on_store_active()
RETURNS TRIGGER AS $$
BEGIN
    -- If store becomes active (meaning they paid for a plan) and reward wasn't paid yet
    IF NEW.status = 'active' AND OLD.status != 'active' AND NEW.referred_by_store_id IS NOT NULL AND NEW.referral_reward_paid = false THEN
        -- Mark as paid to avoid duplicate rewards
        NEW.referral_reward_paid := true;
        
        -- Add $5 to the inviter
        UPDATE public.stores
        SET balance = balance + 5.00
        WHERE id = NEW.referred_by_store_id;

        -- Record transaction
        INSERT INTO public.wallet_transactions (store_id, amount, type, description)
        VALUES (
            NEW.referred_by_store_id, 
            5.00, 
            'deposit', 
            'Referral Reward: Store Activated / مكافأة دعوة ناجحة'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_store_activated_reward_inviter ON public.stores;
CREATE TRIGGER on_store_activated_reward_inviter
    BEFORE UPDATE OF status ON public.stores
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_referral_reward_on_store_active();


-- 7. Trigger to award the $5 bonus to the inviter when the new store recharges wallet
CREATE OR REPLACE FUNCTION public.trigger_referral_reward_on_wallet_deposit()
RETURNS TRIGGER AS $$
DECLARE
    v_store_record RECORD;
BEGIN
    -- Only act on positive manual deposits/recharges
    IF NEW.type IN ('deposit', 'recharge') AND NEW.amount > 0 THEN
        -- Ensure this isn't the initial $2 referral bonus avoiding infinite loops
        IF NEW.description NOT LIKE '%Referral Welcome Bonus%' THEN
            -- Check if this store was referred by someone and the reward hasn't been paid
            SELECT * INTO v_store_record FROM public.stores WHERE id = NEW.store_id;

            IF v_store_record.referred_by_store_id IS NOT NULL AND v_store_record.referral_reward_paid = false THEN
                
                -- Mark as paid
                UPDATE public.stores
                SET referral_reward_paid = true
                WHERE id = NEW.store_id;

                -- Add $5 to the inviter
                UPDATE public.stores
                SET balance = balance + 5.00
                WHERE id = v_store_record.referred_by_store_id;

                -- Record transaction for the inviter
                INSERT INTO public.wallet_transactions (store_id, amount, type, description)
                VALUES (
                    v_store_record.referred_by_store_id, 
                    5.00, 
                    'deposit', 
                    'Referral Reward: Store Wallet Recharged / مكافأة دعوة: عملية شحن'
                );
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_wallet_deposit_reward_inviter ON public.wallet_transactions;
CREATE TRIGGER on_wallet_deposit_reward_inviter
    AFTER INSERT ON public.wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_referral_reward_on_wallet_deposit();

