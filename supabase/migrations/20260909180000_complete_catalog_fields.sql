-- Restore catalog fields used by current forms and stock deduction.
-- Legacy 2025 ALTER scripts cannot safely be replayed before table creation.
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS show_in_header boolean NOT NULL DEFAULT false;
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS skip_cart boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_shipping boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ignore_stock boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fake_countdown_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fake_countdown_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS fake_visitors_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fake_visitors_min integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS fake_visitors_max integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.variant_options
  ADD COLUMN IF NOT EXISTS price numeric,
  ADD COLUMN IF NOT EXISTS stock integer,
  ADD COLUMN IF NOT EXISTS manage_stock boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS in_stock boolean NOT NULL DEFAULT true;

-- Preserve existing quantities. A null default lets legacy inserts supply
-- stock_quantity, while current forms supply stock.
UPDATE public.variant_options SET stock = COALESCE(stock_quantity, 0) WHERE stock IS NULL;

CREATE OR REPLACE FUNCTION public.sync_variant_stock_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.stock := COALESCE(NEW.stock, NEW.stock_quantity, 0);
  ELSIF NEW.stock IS DISTINCT FROM OLD.stock THEN
    NEW.stock := COALESCE(NEW.stock, 0);
  ELSIF NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity THEN
    NEW.stock := COALESCE(NEW.stock_quantity, 0);
  END IF;
  NEW.stock_quantity := NEW.stock;
  IF NEW.manage_stock THEN NEW.in_stock := NEW.stock > 0; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS sync_variant_stock_columns ON public.variant_options;
CREATE TRIGGER sync_variant_stock_columns BEFORE INSERT OR UPDATE ON public.variant_options
FOR EACH ROW EXECUTE FUNCTION public.sync_variant_stock_columns();
UPDATE public.variant_options SET stock_quantity = stock,
  in_stock = CASE WHEN manage_stock THEN stock > 0 ELSE in_stock END;
NOTIFY pgrst, 'reload schema';
