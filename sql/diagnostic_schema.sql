-- Diagnostic RPC to list order columns
CREATE OR REPLACE FUNCTION get_order_table_columns()
RETURNS TABLE (column_name text) AS $$
BEGIN
    RETURN QUERY
    SELECT c.column_name::text
    FROM information_schema.columns c
    WHERE table_name = 'orders'
    AND table_schema = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
