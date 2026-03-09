-- Add a secure RPC to deduct stock for an order's items and their selected variants
CREATE OR REPLACE FUNCTION deduct_order_stock(p_order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_variant JSONB;
    v_product_ignore_stock BOOLEAN;
    v_option_id UUID;
BEGIN
    FOR v_item IN
        SELECT product_id, quantity, product_snapshot
        FROM order_items
        WHERE order_id = p_order_id
    LOOP
        -- Skip items without a valid UUID product_id (e.g., bump offers stored with null)
        IF v_item.product_id IS NULL THEN
            CONTINUE;
        END IF;

        -- Check if product ignores stock
        SELECT COALESCE(ignore_stock, false) INTO v_product_ignore_stock
        FROM products
        WHERE id = v_item.product_id;

        IF NOT v_product_ignore_stock THEN
            -- Deduct from main product stock (only if track_inventory is true)
            UPDATE products
            SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - v_item.quantity)
            WHERE id = v_item.product_id AND track_inventory = true;

            -- Deduct from variant options if any selected
            IF v_item.product_snapshot ? 'variants' THEN
                FOR v_variant IN SELECT * FROM jsonb_array_elements(v_item.product_snapshot->'variants')
                LOOP
                    -- Ensure optionId exists and is valid UUID before casting
                    IF (v_variant->>'optionId') IS NOT NULL AND length(v_variant->>'optionId') = 36 THEN
                        v_option_id := (v_variant->>'optionId')::uuid;
                        
                        -- The 'manage_stock' boolean might be inside the variant JSON from checkout, 
                        -- but it's safer to rely on the DB's manage_stock column
                        UPDATE variant_options
                        SET stock = GREATEST(0, COALESCE(stock, 0) - v_item.quantity),
                            in_stock = CASE WHEN GREATEST(0, COALESCE(stock, 0) - v_item.quantity) <= 0 THEN false ELSE in_stock END
                        WHERE id = v_option_id
                          AND COALESCE(manage_stock, true) = true;
                    END IF;
                END LOOP;
            END IF;
        END IF;
    END LOOP;
END;
$$;
