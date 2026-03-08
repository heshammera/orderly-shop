-- Enable the pg_trgm extension if not exists for ILIKE performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes for full-text search on JSONB fields
CREATE INDEX IF NOT EXISTS idx_products_name_ar_trgm ON public.products USING GIN ((name->>'ar') gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_name_en_trgm ON public.products USING GIN ((name->>'en') gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_desc_ar_trgm ON public.products USING GIN ((description->>'ar') gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_desc_en_trgm ON public.products USING GIN ((description->>'en') gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_sku_trgm ON public.products USING GIN (sku gin_trgm_ops);

-- Advanced search function for products
CREATE OR REPLACE FUNCTION search_and_filter_products(
    p_store_id UUID,
    p_query TEXT DEFAULT '',
    p_category_id UUID DEFAULT NULL,
    p_min_price DECIMAL DEFAULT NULL,
    p_max_price DECIMAL DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'newest', -- newest, price_asc, price_desc
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    name JSONB,
    description JSONB,
    price DECIMAL,
    compare_at_price DECIMAL,
    images JSONB,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- This function handles comprehensive search and filtering in a single optimized query
    -- Using a CTE to get the base filtered products and calculate total count
    RETURN QUERY
    WITH filtered_products AS (
        SELECT 
            p.id,
            p.name,
            p.description,
            p.price,
            p.compare_at_price,
            p.images,
            p.status,
            p.created_at
        FROM products p
        LEFT JOIN product_categories pc ON pc.product_id = p.id
        WHERE p.store_id = p_store_id
        AND p.status = 'active'
        AND (
            p_query = '' OR
            (p.name->>'ar') ILIKE '%' || p_query || '%' OR
            (p.name->>'en') ILIKE '%' || p_query || '%' OR
            (p.description->>'ar') ILIKE '%' || p_query || '%' OR
            (p.description->>'en') ILIKE '%' || p_query || '%' OR
            p.sku ILIKE '%' || p_query || '%'
        )
        AND (p_category_id IS NULL OR pc.category_id = p_category_id)
        AND (p_min_price IS NULL OR p.price >= p_min_price)
        AND (p_max_price IS NULL OR p.price <= p_max_price)
        GROUP BY p.id
    ),
    counted_products AS (
        SELECT *, count(*) over() as full_count FROM filtered_products
    )
    SELECT 
        cp.id,
        cp.name,
        cp.description,
        cp.price,
        cp.compare_at_price,
        cp.images,
        cp.status,
        cp.created_at,
        cp.full_count
    FROM counted_products cp
    ORDER BY 
        CASE WHEN p_sort_by = 'price_asc' THEN cp.price END ASC,
        CASE WHEN p_sort_by = 'price_desc' THEN cp.price END DESC,
        CASE WHEN p_sort_by = 'newest' THEN cp.created_at END DESC,
        cp.created_at DESC -- Default fallback
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;
