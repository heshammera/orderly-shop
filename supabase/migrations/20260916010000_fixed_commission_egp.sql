-- Fixed platform commissions are denominated in EGP; wallet remains USD.
-- Existing settled transactions and balances are not rewritten.
BEGIN;
CREATE OR REPLACE FUNCTION public.handle_new_order_commission()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  INSERT INTO order_commission_settlements(order_id,store_id,amount_local,currency) VALUES(NEW.id,NEW.store_id,charge,CASE WHEN st.commission_type='percentage' THEN coalesce(NEW.currency,st.currency) ELSE 'EGP' END) ON CONFLICT DO NOTHING;
  PERFORM settle_pending_order_commissions(NEW.id);
 END IF;
 RETURN NEW;
END $function$;
NOTIFY pgrst,'reload schema';
COMMIT;
