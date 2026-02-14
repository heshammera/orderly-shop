-- Update handle_new_user trigger to create store automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_store_name TEXT;
  v_store_slug TEXT;
  v_store_id UUID;
BEGIN
  -- 1. Create Profile
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  );

  -- 2. Create User Role (Merchant)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'merchant');

  -- 3. Create Store (if metadata exists)
  v_store_name := NEW.raw_user_meta_data->>'store_name';
  v_store_slug := NEW.raw_user_meta_data->>'store_slug';

  IF v_store_name IS NOT NULL AND v_store_slug IS NOT NULL THEN
    -- Create the store
    INSERT INTO public.stores (owner_id, name, slug)
    VALUES (
      NEW.id, 
      jsonb_build_object('en', v_store_name, 'ar', v_store_name),
      v_store_slug
    ) RETURNING id INTO v_store_id;

    -- Add owner to store_members as 'owner'
    INSERT INTO public.store_members (store_id, user_id, role)
    VALUES (v_store_id, NEW.id, 'owner');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
