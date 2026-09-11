CREATE TABLE public.order_commission_settlements (
 order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
 store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
 amount_local numeric(18,4) NOT NULL CHECK(amount_local>=0), currency text NOT NULL,
 amount_usd numeric(18,2), exchange_rate numeric(20,8), rate_updated_at timestamptz,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','settled')),
 created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.order_commission_settlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_commission_settlements FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.order_commission_settlements TO service_role;
CREATE FUNCTION public.settle_pending_order_commissions(p_order uuid DEFAULT NULL) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE item order_commission_settlements; rate numeric; at timestamptz; usd numeric; total_settled integer:=0;
BEGIN
 FOR item IN SELECT * FROM order_commission_settlements WHERE status='pending' AND (p_order IS NULL OR order_id=p_order) ORDER BY created_at LIMIT 100 FOR UPDATE SKIP LOCKED LOOP
  rate:=NULL;at:=NULL;
  IF item.currency='USD' THEN rate:=1;at:=now();
  ELSE SELECT (rates->>item.currency)::numeric,provider_updated_at INTO rate,at FROM currency_rate_cache WHERE base='USD' AND provider_updated_at>=now()-interval '48 hours' AND provider_updated_at<=now()+interval '5 minutes'; END IF;
  IF rate IS NULL OR rate<=0 THEN CONTINUE; END IF;
  usd:=round(item.amount_local/rate,2);
  UPDATE stores SET balance=coalesce(balance,0)-usd WHERE id=item.store_id;
  IF usd>0 THEN INSERT INTO wallet_transactions(store_id,amount,type,reference_id,description) VALUES(item.store_id,-usd,'commission',item.order_id,'Order commission settled in USD; source '||item.amount_local||' '||item.currency||'; USD rate '||rate); END IF;
  UPDATE order_commission_settlements SET status='settled',amount_usd=usd,exchange_rate=rate,rate_updated_at=at WHERE order_id=item.order_id;
  total_settled:=total_settled+1;
 END LOOP;
 RETURN total_settled;
END $$;
REVOKE ALL ON FUNCTION public.settle_pending_order_commissions(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.settle_pending_order_commissions(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.handle_new_order_commission() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE st stores; plan_limit integer; usage_count integer; charge numeric;
BEGIN
 SELECT * INTO st FROM stores WHERE id=NEW.store_id;
 IF st.has_unlimited_balance THEN RETURN NEW; END IF;
 SELECT (p.features->>'orders_monthly')::integer INTO plan_limit FROM store_subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.store_id=NEW.store_id AND s.status='active' LIMIT 1;
 IF plan_limit=-1 THEN RETURN NEW; END IF;
 IF plan_limit>0 THEN
  SELECT count(*) INTO usage_count FROM orders WHERE store_id=NEW.store_id AND created_at>=date_trunc('month',now());
  IF usage_count<=plan_limit THEN RETURN NEW; END IF;
 END IF;
 IF st.commission_type='percentage' THEN charge:=NEW.total*st.commission_value/100; ELSE charge:=st.commission_value; END IF;
 IF charge>0 THEN
  INSERT INTO order_commission_settlements(order_id,store_id,amount_local,currency) VALUES(NEW.id,NEW.store_id,charge,CASE WHEN st.commission_type='percentage' THEN coalesce(NEW.currency,st.currency) ELSE 'USD' END) ON CONFLICT DO NOTHING;
  PERFORM settle_pending_order_commissions(NEW.id);
 END IF;
 RETURN NEW;
END $$;
NOTIFY pgrst,'reload schema';
