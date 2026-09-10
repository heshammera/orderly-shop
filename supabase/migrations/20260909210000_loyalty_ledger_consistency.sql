CREATE OR REPLACE VIEW public.public_products AS
 SELECT id,store_id,name,description,price,compare_at_price,sale_price,images,status,
 stock_quantity,track_inventory,ignore_stock,max_per_order,skip_cart,free_shipping,
 fake_countdown_enabled,fake_countdown_minutes,fake_visitors_enabled,fake_visitors_min,fake_visitors_max,
 metadata,created_at,updated_at,sku
 FROM public.products WHERE status='active' AND public.is_public_store(store_id);

UPDATE public.customers c SET loyalty_points=l.points FROM public.loyalty_points l
WHERE l.customer_id=c.id AND l.store_id=c.store_id AND c.loyalty_points=0;
CREATE OR REPLACE FUNCTION public.apply_customer_loyalty_ledger() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.customer_id IS NULL THEN RETURN NEW; END IF;
 IF NOT EXISTS(SELECT 1 FROM customers WHERE id=NEW.customer_id AND store_id=NEW.store_id) THEN RAISE EXCEPTION 'Customer does not belong to store'; END IF;
 UPDATE customers SET loyalty_points=loyalty_points+NEW.points WHERE id=NEW.customer_id;
 IF EXISTS(SELECT 1 FROM customers WHERE id=NEW.customer_id AND loyalty_points<0) THEN RAISE EXCEPTION 'Insufficient loyalty balance'; END IF;
 RETURN NEW;
END;$$;
CREATE TRIGGER apply_customer_loyalty_ledger AFTER INSERT ON public.loyalty_transactions
FOR EACH ROW EXECUTE FUNCTION public.apply_customer_loyalty_ledger();
CREATE OR REPLACE FUNCTION public.earn_delivered_order_points() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s jsonb;points_awarded integer;
BEGIN
 IF NEW.status='delivered' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.customer_id IS NOT NULL THEN
  SELECT settings INTO s FROM stores WHERE id=NEW.store_id;
  IF coalesce((s->>'loyalty_program_enabled')::boolean,false) THEN
   points_awarded:=greatest(0,floor(NEW.total*coalesce((s->>'loyalty_earning_rate')::numeric,1)));
   IF points_awarded>0 THEN
    INSERT INTO loyalty_transactions(store_id,customer_id,order_id,points,type,description)
    VALUES(NEW.store_id,NEW.customer_id,NEW.id,points_awarded,'earn','Points from delivered order')
    ON CONFLICT(order_id,type) WHERE order_id IS NOT NULL DO NOTHING;
   END IF;
  END IF;
 END IF;
 RETURN NEW;
END;$$;
CREATE TRIGGER earn_delivered_order_points AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.earn_delivered_order_points();
REVOKE ALL ON FUNCTION public.apply_customer_loyalty_ledger() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.earn_delivered_order_points() FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';
