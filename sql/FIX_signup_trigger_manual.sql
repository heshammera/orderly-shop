-- ==============================================================================
-- إشعار هام: قم بنسخ هذا الكود ولصقه في Supabase SQL Editor ثم اضغط Run
-- هذا السكربت يضمن إصلاح مشكلة عدم إنشاء المتجر والملف الشخصي عند التسجيل
-- ==============================================================================

-- 1. التأكد من أن الدالة تعمل بصلاحيات الإدمن (SECURITY DEFINER)
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
  -- أ. إنشاء الملف الشخصي (Profile)
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (user_id) DO NOTHING; -- تفادي أي مشكلة إذا كان موجوداً

  -- ب. إسناد صلاحية تاجر (Merchant)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'merchant')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- ج. استخراج بيانات المتجر من الميتاداتا
  v_store_name := NEW.raw_user_meta_data->>'store_name';
  v_store_slug := NEW.raw_user_meta_data->>'store_slug';
  v_referral_code := NEW.raw_user_meta_data->>'referral_code';

  -- د. التأكد من وجود البيانات لإنشاء المتجر
  IF v_store_name IS NOT NULL AND v_store_slug IS NOT NULL THEN
      -- التحقق من كود الإحالة (Referral)
      IF v_referral_code IS NOT NULL AND BTRIM(v_referral_code) != '' THEN
          SELECT id INTO v_referred_by_id 
          FROM public.stores 
          WHERE UPPER(referral_code) = UPPER(BTRIM(v_referral_code)) 
          LIMIT 1;
          
          IF v_referred_by_id IS NOT NULL THEN
              v_initial_balance := 2.00;
              v_initial_status := 'active';
          END IF;
      END IF;

      -- هـ. إنشاء المتجر
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

      -- و. إضافة التاجر كمالك للمتجر
      INSERT INTO public.store_members (store_id, user_id, role)
      VALUES (v_store_id, NEW.id, 'owner')
      ON CONFLICT DO NOTHING;

      -- ز. إضافة المكافآت وتفعيل الباقة المجانية إذا كان مدعواً
      IF v_referred_by_id IS NOT NULL THEN
          -- إيداع للتاجر الجديد
          INSERT INTO public.wallet_transactions (store_id, amount, type, description)
          VALUES (v_store_id, 2.00, 'deposit', 'Referral Welcome Bonus / مكافأة ترحيبية عبر دعوة');

          -- ربط الباقة المجانية
          SELECT id INTO v_free_plan_id FROM public.plans ORDER BY price_monthly ASC NULLS LAST LIMIT 1;
          IF v_free_plan_id IS NOT NULL THEN
              INSERT INTO public.store_subscriptions (store_id, plan_id, status, current_period_start, current_period_end)
              VALUES (v_store_id, v_free_plan_id, 'active', now(), now() + interval '10 years');
          END IF;

          -- مكافأة الداعي
          IF v_initial_status = 'active' THEN
             UPDATE public.stores
             SET balance = COALESCE(balance, 0) + 5.00
             WHERE id = v_referred_by_id;

             INSERT INTO public.wallet_transactions (store_id, amount, type, description)
             VALUES (v_referred_by_id, 5.00, 'deposit', 'Referral Reward / مكافأة دعوة تاجر');
          END IF;
      END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. التأكد من ربط الدالة بجدول المستخدمين (Drop and Recreate Trigger)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 3. إصلاح مشكلة عدم ظهور المتاجر في لوحة تحكم السوبر أدمن
-- المشكلة كانت في دالة get_all_stores_paginated التي كانت تربط owner_id مع profiles.id بدلاً من profiles.user_id
-- ==============================================================================
CREATE OR REPLACE FUNCTION get_all_stores_paginated(
    p_page INT DEFAULT 1,
    p_limit INT DEFAULT 10,
    p_search TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_offset INT;
    v_total_count INT;
    v_stores JSON;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    -- Get Total Count
    SELECT COUNT(*) INTO v_total_count
    FROM stores s
    LEFT JOIN profiles p ON s.owner_id = p.user_id -- <-- التصحيح هنا
    WHERE (p_search IS NULL OR s.name::text ILIKE '%' || p_search || '%' OR s.slug ILIKE '%' || p_search || '%' OR p.full_name ILIKE '%' || p_search || '%')
      AND (p_status IS NULL OR p_status = 'all' OR s.status = p_status);

    -- Get Data
    SELECT json_agg(t) INTO v_stores
    FROM (
        SELECT 
            s.id,
            s.name,
            s.slug,
            s.status,
            s.status_reason,
            s.logo_url,
            s.created_at,
            s.balance,
            (SELECT email FROM auth.users WHERE id = s.owner_id) as owner_email, -- جلب الإيميل مباشرة من auth.users
            p.full_name as owner_name,
            (SELECT name_ar FROM plans pl JOIN store_subscriptions ss ON ss.plan_id = pl.id WHERE ss.store_id = s.id AND ss.status = 'active' LIMIT 1) as plan_name
        FROM stores s
        LEFT JOIN profiles p ON s.owner_id = p.user_id -- <-- التصحيح هنا
        WHERE (p_search IS NULL OR s.name::text ILIKE '%' || p_search || '%' OR s.slug ILIKE '%' || p_search || '%' OR p.full_name ILIKE '%' || p_search || '%')
          AND (p_status IS NULL OR p_status = 'all' OR s.status = p_status)
        ORDER BY s.created_at DESC
        LIMIT p_limit OFFSET v_offset
    ) t;

    RETURN json_build_object(
        'data', COALESCE(v_stores, '[]'::json),
        'total', v_total_count,
        'page', p_page,
        'limit', p_limit
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

