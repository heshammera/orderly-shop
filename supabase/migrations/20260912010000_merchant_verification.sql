CREATE TABLE public.merchant_contact_verifications (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 verified_email text, email_verified_at timestamptz,
 verified_phone text, phone_verified_at timestamptz
);
ALTER TABLE public.merchant_contact_verifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.merchant_contact_verifications FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.merchant_contact_verifications TO service_role;
CREATE TABLE public.merchant_verification_challenges (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 method text NOT NULL CHECK(method IN ('email','whatsapp')),destination text NOT NULL,
 code_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL DEFAULT now()+interval '10 minutes',
 attempts integer NOT NULL DEFAULT 0, consumed_at timestamptz,
 delivery_state text NOT NULL DEFAULT 'pending' CHECK(delivery_state IN ('pending','sent','failed'))
);
CREATE INDEX merchant_challenge_user_time ON public.merchant_verification_challenges(user_id,created_at);
ALTER TABLE public.merchant_verification_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.merchant_verification_challenges FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.merchant_verification_challenges TO service_role;
CREATE FUNCTION public.merchant_is_verified(p_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM merchant_contact_verifications v JOIN auth.users u ON u.id=v.user_id LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=p_user AND (
  (v.email_verified_at IS NOT NULL AND lower(v.verified_email)=lower(u.email)) OR
  (v.phone_verified_at IS NOT NULL AND v.verified_phone=regexp_replace(translate(coalesce(p.phone,''),'٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹','01234567890123456789'),'[\s()\-]','','g'))));
$$;
REVOKE ALL ON FUNCTION public.merchant_is_verified(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.merchant_is_verified(uuid) TO service_role;
CREATE FUNCTION public.merchant_verification_status() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$ SELECT jsonb_build_object('verified',merchant_is_verified(auth.uid())); $$;
REVOKE ALL ON FUNCTION public.merchant_verification_status() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.merchant_verification_status() TO authenticated,service_role;
CREATE FUNCTION public.issue_merchant_challenge(p_user uuid,p_id uuid,p_method text,p_destination text,p_hash text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM 1 FROM auth.users WHERE id=p_user FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('error','الحساب غير موجود'); END IF;
 IF EXISTS(SELECT 1 FROM merchant_verification_challenges WHERE user_id=p_user AND created_at>now()-interval '60 seconds') THEN RETURN jsonb_build_object('error','انتظر دقيقة قبل طلب رمز جديد'); END IF;
 IF (SELECT count(*) FROM merchant_verification_challenges WHERE user_id=p_user AND created_at>now()-interval '1 hour')>=5 THEN RETURN jsonb_build_object('error','وصلت إلى الحد الأقصى: 5 رموز في الساعة. حاول لاحقًا.'); END IF;
 UPDATE merchant_verification_challenges SET consumed_at=now() WHERE user_id=p_user AND consumed_at IS NULL;
 INSERT INTO merchant_verification_challenges(id,user_id,method,destination,code_hash) VALUES(p_id,p_user,p_method,p_destination,p_hash);
 RETURN jsonb_build_object('success',true);
END $$;
CREATE FUNCTION public.consume_merchant_challenge(p_user uuid,p_id uuid,p_hash text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE c merchant_verification_challenges; current_destination text;
BEGIN
 SELECT * INTO c FROM merchant_verification_challenges WHERE id=p_id AND user_id=p_user FOR UPDATE;
 IF NOT FOUND OR c.consumed_at IS NOT NULL OR c.expires_at<now() OR c.delivery_state<>'sent' OR c.attempts>=5 THEN RETURN jsonb_build_object('error','الرمز غير صالح أو انتهت صلاحيته. اطلب رمزًا جديدًا.'); END IF;
 UPDATE merchant_verification_challenges SET attempts=attempts+1 WHERE id=c.id;
 IF c.code_hash<>p_hash THEN RETURN jsonb_build_object('error','رمز التفعيل غير صحيح','attemptsRemaining',4-c.attempts); END IF;
 IF c.method='email' THEN SELECT lower(email) INTO current_destination FROM auth.users WHERE id=p_user;
 ELSE SELECT regexp_replace(translate(coalesce(phone,''),'٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹','01234567890123456789'),'[\s()\-]','','g') INTO current_destination FROM profiles WHERE user_id=p_user; END IF;
 IF current_destination<>c.destination OR current_destination IS NULL THEN RETURN jsonb_build_object('error','تغيرت بيانات التواصل. اطلب رمزًا جديدًا.'); END IF;
 INSERT INTO merchant_contact_verifications(user_id) VALUES(p_user) ON CONFLICT DO NOTHING;
 IF c.method='email' THEN UPDATE merchant_contact_verifications SET verified_email=c.destination,email_verified_at=now() WHERE user_id=p_user;
 ELSE UPDATE merchant_contact_verifications SET verified_phone=c.destination,phone_verified_at=now() WHERE user_id=p_user; END IF;
 UPDATE merchant_verification_challenges SET consumed_at=now() WHERE id=c.id;
 RETURN jsonb_build_object('success',true,'method',c.method);
END $$;
REVOKE ALL ON FUNCTION public.issue_merchant_challenge(uuid,uuid,text,text,text),public.consume_merchant_challenge(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.issue_merchant_challenge(uuid,uuid,text,text,text),public.consume_merchant_challenge(uuid,uuid,text) TO service_role;
-- Retire the old unauthenticated OTP functions that exposed codes or conflated email and phone verification.
DO $$ DECLARE fn record; BEGIN
 FOR fn IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('generate_otp','verify_otp','get_unverified_user_by_email') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',fn.signature);
 END LOOP;
END $$;
-- The guard is activated separately after deployment and successful delivery tests.
CREATE FUNCTION public.enforce_merchant_verification() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.role()='authenticated' AND current_setting('request.path',true) NOT IN ('/rpc/merchant_verification_status','/profiles','/user_roles') AND NOT merchant_is_verified(auth.uid()) THEN
 RAISE sqlstate 'PT403' USING MESSAGE='فعّل بريدك الإلكتروني أو رقم واتساب أولًا',DETAIL='MERCHANT_VERIFICATION_REQUIRED';
 END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.enforce_merchant_verification() TO anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
