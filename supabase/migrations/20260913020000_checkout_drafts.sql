ALTER TABLE public.abandoned_carts ADD COLUMN session_id uuid;
ALTER TABLE public.abandoned_carts ADD COLUMN contacted_at timestamptz;
ALTER TABLE public.abandoned_carts ADD COLUMN source_key text NOT NULL DEFAULT 'cart';
ALTER TABLE public.abandoned_carts ADD COLUMN last_activity_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.abandoned_carts ADD COLUMN recovered_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;
UPDATE public.abandoned_carts SET last_activity_at=updated_at;
CREATE UNIQUE INDEX abandoned_checkout_session ON public.abandoned_carts(store_id,session_id,source_key);
CREATE INDEX abandoned_checkout_store_activity ON public.abandoned_carts(store_id,last_activity_at DESC);
CREATE FUNCTION public.save_checkout_draft(p_store uuid,p_session uuid,p_source text,p_name text,p_phone text,p_items jsonb,p_total numeric) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result uuid;
BEGIN
 INSERT INTO abandoned_carts(store_id,session_id,source_key,customer_name,customer_phone,cart_items,total_price,last_activity_at)
 VALUES(p_store,p_session,p_source,p_name,p_phone,p_items,p_total,now())
 ON CONFLICT(store_id,session_id,source_key) DO UPDATE SET customer_name=excluded.customer_name,customer_phone=excluded.customer_phone,cart_items=excluded.cart_items,total_price=excluded.total_price,last_activity_at=now()
 WHERE abandoned_carts.recovery_status='pending' RETURNING id INTO result;
 IF result IS NULL THEN SELECT id INTO result FROM abandoned_carts WHERE store_id=p_store AND session_id=p_session AND source_key=p_source; END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.save_checkout_draft(uuid,uuid,text,text,text,jsonb,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_checkout_draft(uuid,uuid,text,text,text,jsonb,numeric) TO service_role;
CREATE FUNCTION public.checkout_draft_stats(p_store uuid,p_since timestamptz) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('total',count(*),'pending',count(*) FILTER(WHERE recovery_status='pending' AND last_activity_at<now()-interval '30 minutes'),'live',count(*) FILTER(WHERE recovery_status='pending' AND last_activity_at>=now()-interval '30 minutes'),'recovered',count(*) FILTER(WHERE recovery_status='recovered'),'lost',count(*) FILTER(WHERE recovery_status='lost'),'pendingValue',coalesce(sum(total_price) FILTER(WHERE recovery_status='pending' AND last_activity_at<now()-interval '30 minutes'),0))
 FROM abandoned_carts WHERE store_id=p_store AND created_at>=p_since;
$$;
REVOKE ALL ON FUNCTION public.checkout_draft_stats(uuid,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.checkout_draft_stats(uuid,timestamptz) TO authenticated,service_role;
DROP POLICY IF EXISTS "Anyone can insert an abandoned cart" ON public.abandoned_carts;
NOTIFY pgrst,'reload schema';
