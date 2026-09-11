CREATE TABLE public.currency_rate_cache(base text PRIMARY KEY CHECK(base='USD'), rates jsonb NOT NULL, provider_updated_at timestamptz NOT NULL, fetched_at timestamptz NOT NULL);
ALTER TABLE public.currency_rate_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.currency_rate_cache FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.currency_rate_cache TO service_role;
CREATE TABLE public.wallet_recharge_quotes(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, amount_usd numeric(12,2) NOT NULL CHECK(amount_usd>=5 AND amount_usd<=100000),
 payment_currency text NOT NULL, amount_local numeric(18,3) NOT NULL CHECK(amount_local>0), exchange_rate numeric(20,8) NOT NULL CHECK(exchange_rate>0),
 rate_updated_at timestamptz NOT NULL, wallet_id text NOT NULL, wallet_snapshot jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '24 hours');
ALTER TABLE public.wallet_recharge_quotes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wallet_recharge_quotes FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.wallet_recharge_quotes TO service_role;
ALTER TABLE public.wallet_recharge_requests ADD COLUMN payment_currency text, ADD COLUMN rate_updated_at timestamptz, ADD COLUMN quote_id uuid UNIQUE REFERENCES wallet_recharge_quotes(id), ADD COLUMN wallet_snapshot jsonb;
DROP VIEW public.recharge_requests;
ALTER TABLE public.wallet_recharge_requests ALTER COLUMN exchange_rate TYPE numeric(20,8), ALTER COLUMN amount_local TYPE numeric(18,3);
CREATE VIEW public.recharge_requests WITH (security_invoker=true) AS SELECT * FROM public.wallet_recharge_requests;
GRANT SELECT ON public.recharge_requests TO authenticated,service_role;
-- Historical request currency was derived from the store at submission; do not rewrite amounts.
UPDATE public.wallet_recharge_requests r SET payment_currency=s.currency FROM public.stores s WHERE s.id=r.store_id;
-- All currently configured receiving wallets accept EGP, confirmed by the owner.
UPDATE public.system_settings SET value=jsonb_set(value,'{wallets}',(SELECT jsonb_agg(w || jsonb_build_object('currency','EGP')) FROM jsonb_array_elements(value->'wallets') w)) WHERE key='payment_wallets' AND jsonb_typeof(value->'wallets')='array';
CREATE FUNCTION public.guard_recharge_write() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF coalesce(auth.role(),'')<>'service_role' AND session_user NOT IN ('postgres','supabase_admin') THEN
  RAISE EXCEPTION 'يجب إنشاء ومراجعة طلب الشحن عبر الخدمة المعتمدة';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER require_server_recharge BEFORE INSERT OR UPDATE ON public.wallet_recharge_requests FOR EACH ROW EXECUTE FUNCTION public.guard_recharge_write();
CREATE FUNCTION public.submit_recharge_quote(p_quote uuid,p_user uuid,p_phone text,p_proof text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE q wallet_recharge_quotes; rid uuid;
BEGIN
 SELECT * INTO q FROM wallet_recharge_quotes WHERE id=p_quote AND user_id=p_user FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'عرض الشحن غير موجود'; END IF;
 SELECT id INTO rid FROM wallet_recharge_requests WHERE quote_id=q.id;
 IF rid IS NOT NULL THEN RETURN rid; END IF;
 IF q.expires_at<now() THEN RAISE EXCEPTION 'انتهت صلاحية المبلغ المعروض. اطلب سعرًا جديدًا قبل التحويل.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM stores WHERE id=q.store_id AND owner_id=p_user) THEN RAISE EXCEPTION 'غير مصرح'; END IF;
 INSERT INTO wallet_recharge_requests(store_id,amount_usd,amount_local,exchange_rate,payment_currency,rate_updated_at,quote_id,wallet_snapshot,sender_phone,proof_image,status)
 VALUES(q.store_id,q.amount_usd,q.amount_local,q.exchange_rate,q.payment_currency,q.rate_updated_at,q.id,q.wallet_snapshot,p_phone,p_proof,'pending') RETURNING id INTO rid;
 RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.submit_recharge_quote(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_recharge_quote(uuid,uuid,text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.approve_recharge_request(request_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE req wallet_recharge_requests;
BEGIN
 SELECT * INTO req FROM wallet_recharge_requests WHERE id=request_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'طلب الشحن غير موجود'; END IF;
 IF req.status='approved' THEN RETURN; END IF;
 IF req.status<>'pending' THEN RAISE EXCEPTION 'تمت معالجة الطلب مسبقًا'; END IF;
 UPDATE stores SET balance=coalesce(balance,0)+req.amount_usd,updated_at=now() WHERE id=req.store_id;
 UPDATE wallet_recharge_requests SET status='approved',updated_at=now() WHERE id=request_id;
 INSERT INTO wallet_transactions(store_id,amount,type,reference_id,description) VALUES(req.store_id,req.amount_usd,'recharge',request_id,'Wallet recharge in USD');
END $$;
REVOKE ALL ON FUNCTION public.approve_recharge_request(uuid),public.approve_wallet_recharge(uuid),public.reject_wallet_recharge(uuid),public.admin_recharge_wallet(uuid,numeric,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.approve_recharge_request(uuid),public.admin_recharge_wallet(uuid,numeric,text,text) TO service_role;
ALTER TABLE public.stores ALTER COLUMN currency SET DEFAULT 'EGP';
CREATE FUNCTION public.guard_store_currency() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF TG_OP='INSERT' OR NEW.currency IS DISTINCT FROM OLD.currency THEN
  IF NEW.currency NOT IN ('EGP','SAR','AED','KWD','BHD','OMR','QAR','JOD','USD','EUR') THEN RAISE EXCEPTION 'عملة المتجر غير مدعومة'; END IF;
 END IF;
 IF TG_OP='UPDATE' AND NEW.currency IS DISTINCT FROM OLD.currency THEN
  IF EXISTS(SELECT 1 FROM products WHERE store_id=OLD.id) OR EXISTS(SELECT 1 FROM orders WHERE store_id=OLD.id) OR EXISTS(SELECT 1 FROM coupons WHERE store_id=OLD.id)
   OR coalesce(OLD.settings->'shipping','{}'::jsonb) NOT IN ('{}'::jsonb,'null'::jsonb)
  THEN RAISE EXCEPTION 'لا يمكن تغيير عملة متجر لديه منتجات أو طلبات أو أسعار شحن أو كوبونات. يلزم تحويل الأسعار بشكل مدروس؛ تغيير الرمز وحده لا يحوّل المبالغ.'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_store_currency BEFORE INSERT OR UPDATE OF currency ON public.stores FOR EACH ROW EXECUTE FUNCTION public.guard_store_currency();

CREATE OR REPLACE FUNCTION public.create_store(p_name text, p_slug text, p_currency text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
    v_store_id UUID;
    v_active_stores_count INT;
    v_max_stores INT;
    v_best_plan_id UUID;
    v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
    IF p_currency NOT IN ('EGP','SAR','AED','KWD','BHD','OMR','QAR','JOD','USD','EUR') THEN RAISE EXCEPTION 'Unsupported currency'; END IF;
    -- 1. Check current active stores count for this user (where they are owner)
    SELECT COUNT(*) INTO v_active_stores_count
    FROM stores
    WHERE owner_id = auth.uid() AND status = 'active';

    -- 2. Determine best active plan and max stores allowed
    SELECT ss.plan_id, COALESCE((p.features->>'stores_limit')::int, 1), ss.current_period_end 
    INTO v_best_plan_id, v_max_stores, v_period_end
    FROM store_subscriptions ss
    JOIN plans p ON ss.plan_id = p.id
    JOIN stores s ON ss.store_id = s.id
    WHERE s.owner_id = auth.uid() AND ss.status IN ('active', 'trialing')
    ORDER BY (p.features->>'stores_limit')::int DESC
    LIMIT 1;

    -- Default if no active plan found
    IF v_max_stores IS NULL THEN
        v_max_stores := 1;
    END IF;

    -- 3. Enforce Limit (-1 means unlimited)
    IF v_max_stores != -1 AND v_active_stores_count >= v_max_stores AND v_active_stores_count > 0 THEN
        RAISE EXCEPTION 'You have reached the limit of stores allowed by your plan (% stores). Please upgrade your plan to add more.', v_max_stores;
    END IF;

    -- 4. Create Store
    INSERT INTO public.stores (owner_id, name, slug, currency, status)
    VALUES (
        auth.uid(), 
        jsonb_build_object('en', p_name, 'ar', p_name), 
        p_slug,
        p_currency, 
        CASE WHEN v_best_plan_id IS NOT NULL THEN 'active' ELSE 'pending_plan' END
    )
    RETURNING id INTO v_store_id;

    -- 4.5 Auto-link Subscription if active plan exists
    IF v_best_plan_id IS NOT NULL THEN
        INSERT INTO public.store_subscriptions (store_id, plan_id, status, current_period_start, current_period_end)
        VALUES (v_store_id, v_best_plan_id, 'active', NOW(), v_period_end);
    END IF;

    -- 5. Add as Owner in Members
    INSERT INTO public.store_members (store_id, user_id, role)
    VALUES (v_store_id, auth.uid(), 'owner');

    RETURN v_store_id;
END;
$function$
;
REVOKE ALL ON FUNCTION public.create_store(text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_store(text,text,text) TO authenticated,service_role;
NOTIFY pgrst, 'reload schema';
