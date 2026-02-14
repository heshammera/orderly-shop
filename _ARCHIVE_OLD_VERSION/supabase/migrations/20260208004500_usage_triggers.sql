-- Function to update product count
CREATE OR REPLACE FUNCTION public.handle_product_usage_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Upsert product count (Start at 1 if new, else increment)
        INSERT INTO public.usage_records (store_id, metric, value)
        VALUES (NEW.store_id, 'products_count', 1)
        ON CONFLICT (store_id, metric)
        DO UPDATE SET value = usage_records.value + 1, updated_at = now();
    ELSIF (TG_OP = 'DELETE') THEN
        -- Decrement product count
        UPDATE public.usage_records
        SET value = GREATEST(0, value - 1), updated_at = now()
        WHERE store_id = OLD.store_id AND metric = 'products_count';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_product_change ON public.products;
CREATE TRIGGER on_product_change
AFTER INSERT OR DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.handle_product_usage_change();

-- Sync existing counts (Run this once to backfill)
INSERT INTO public.usage_records (store_id, metric, value)
SELECT store_id, 'products_count', count(*)
FROM public.products
GROUP BY store_id
ON CONFLICT (store_id, metric)
DO UPDATE SET value = EXCLUDED.value;
