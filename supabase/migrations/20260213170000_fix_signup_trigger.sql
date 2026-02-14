-- Fix handle_new_user trigger logic
-- Reverting regressions from previous migration and applying correct subscription status logic

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_store_name TEXT;
  v_store_slug TEXT;
  v_store_id UUID;
BEGIN
  -- 1. Create Profile
  -- Restore original logic: use user_id, full_name, phone (if available)
  -- Assuming 'id' is auto-generated or matches user_id depending on schema. 
  -- Based on 20260213123000, we used (user_id, full_name, phone).
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name'
  );

  -- 2. Create User Role (Merchant)
  -- This was missing in the broken version
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'merchant');

  -- 3. Create Store
  v_store_name := NEW.raw_user_meta_data->>'store_name';
  v_store_slug := NEW.raw_user_meta_data->>'store_slug';

  -- Ensure we have store data (signup wizard provides it)
  IF v_store_name IS NOT NULL AND v_store_slug IS NOT NULL THEN
      INSERT INTO public.stores (owner_id, name, slug, status)
      VALUES (
        NEW.id, 
        -- Fix: Build JSONB object for name as expected by schema
        jsonb_build_object('en', v_store_name, 'ar', v_store_name),
        v_store_slug,
        'pending_plan' -- Set initial status to pending_plan
      ) RETURNING id INTO v_store_id;

      -- 4. Add owner to store_members
      INSERT INTO public.store_members (store_id, user_id, role)
      VALUES (v_store_id, NEW.id, 'owner');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
