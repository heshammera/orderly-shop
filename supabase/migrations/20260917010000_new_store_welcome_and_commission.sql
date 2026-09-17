BEGIN;
ALTER TABLE public.stores ALTER COLUMN commission_type SET DEFAULT 'fixed';
ALTER TABLE public.stores ALTER COLUMN commission_value SET DEFAULT 1.00;
CREATE OR REPLACE FUNCTION public.set_new_store_commission_defaults()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 NEW.commission_type:='fixed';
 NEW.commission_value:=1.00;
 RETURN NEW;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS wallet_new_store_welcome_once
ON public.wallet_transactions(store_id)
WHERE type='adjustment' AND description='New store welcome credit (USD) / رصيد ترحيبي لمتجر جديد';
CREATE OR REPLACE FUNCTION public.credit_new_store_welcome()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE credited uuid;
BEGIN
 INSERT INTO public.wallet_transactions(store_id,amount,type,reference_id,description)
 VALUES(NEW.id,1.00,'adjustment',NEW.id,'New store welcome credit (USD) / رصيد ترحيبي لمتجر جديد')
 ON CONFLICT (store_id) WHERE type='adjustment' AND description='New store welcome credit (USD) / رصيد ترحيبي لمتجر جديد'
 DO NOTHING RETURNING id INTO credited;
 IF credited IS NOT NULL THEN
  UPDATE public.stores SET balance=coalesce(balance,0)+1.00 WHERE id=NEW.id;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.set_new_store_commission_defaults() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.credit_new_store_welcome() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS new_store_commission_defaults ON public.stores;
CREATE TRIGGER new_store_commission_defaults BEFORE INSERT ON public.stores
FOR EACH ROW EXECUTE FUNCTION public.set_new_store_commission_defaults();
DROP TRIGGER IF EXISTS new_store_welcome_credit ON public.stores;
CREATE TRIGGER new_store_welcome_credit AFTER INSERT ON public.stores
FOR EACH ROW EXECUTE FUNCTION public.credit_new_store_welcome();
NOTIFY pgrst,'reload schema';
COMMIT;
