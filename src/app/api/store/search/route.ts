import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');
        const query = searchParams.get('q') || '';
        const categoryId = searchParams.get('category') || null;
        const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null;
        const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;
        const sortBy = searchParams.get('sort') || 'newest';
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        if (!storeId) {
            return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
        }

        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        // Try using the custom RPC function first for advanced search
        const { data: rpcData, error: rpcError } = await supabase.rpc('search_and_filter_products', {
            p_store_id: storeId,
            p_query: query,
            p_category_id: categoryId,
            p_min_price: minPrice,
            p_max_price: maxPrice,
            p_sort_by: sortBy,
            p_limit: limit,
            p_offset: offset
        });

        if (!rpcError && rpcData) {
            return NextResponse.json({
                products: rpcData,
                total: rpcData.length > 0 ? Number(rpcData[0].total_count) : 0,
                source: 'rpc'
            });
        }

        // Fallback to standard Supabase JS client if RPC fails or isn't deployed
        console.warn('RPC failed, falling back to JS client:', rpcError?.message);

        let dbQuery = supabase
            .from('products')
            .select(categoryId ? '*, product_categories!inner(category_id)' : '*')
            .eq('store_id', storeId)
            .eq('status', 'active');

        if (categoryId) {
            dbQuery = dbQuery.eq('product_categories.category_id', categoryId);
        }

        // Remove the PostgREST OR filter since data is stringified JSONB
        // We will perform the search in Javascript over the fetched array.

        if (minPrice !== null) dbQuery = dbQuery.gte('price', minPrice);
        if (maxPrice !== null) dbQuery = dbQuery.lte('price', maxPrice);

        if (sortBy === 'price_asc') {
            dbQuery = dbQuery.order('price', { ascending: true });
        } else if (sortBy === 'price_desc') {
            dbQuery = dbQuery.order('price', { ascending: false });
        } else {
            dbQuery = dbQuery.order('created_at', { ascending: false });
        }

        if (!query) {
            // If no search query, we can paginate at the DB level
            dbQuery = dbQuery.range(offset, offset + limit - 1);
        }

        const { data, error } = await dbQuery;

        if (error) throw error;

        // Parse JSON fields safely handling double stringification
        let parsedData = (data as any[])?.map((p: any) => {
            let name = p.name;
            let description = p.description;
            let images = p.images;

            try { if (typeof name === 'string') name = JSON.parse(name); } catch (e) { }
            try { if (typeof description === 'string') description = JSON.parse(description); } catch (e) { }
            try { if (typeof images === 'string') images = JSON.parse(images); } catch (e) { }

            return {
                ...p,
                name,
                description,
                images,
            };
        }) || [];

        let total = parsedData.length;

        // Perform in-memory search if query exists
        if (query) {
            const lowerQuery = query.toLowerCase();
            parsedData = parsedData.filter(p => {
                const nameAr = (p.name?.ar || '').toLowerCase();
                const nameEn = (p.name?.en || '').toLowerCase();
                const descAr = (p.description?.ar || '').toLowerCase();
                const descEn = (p.description?.en || '').toLowerCase();
                const sku = (p.sku || '').toLowerCase();

                return nameAr.includes(lowerQuery) ||
                    nameEn.includes(lowerQuery) ||
                    descAr.includes(lowerQuery) ||
                    descEn.includes(lowerQuery) ||
                    sku.includes(lowerQuery);
            });
            total = parsedData.length;
            // Apply memory pagination
            parsedData = parsedData.slice(offset, offset + limit);
        }

        return NextResponse.json({
            products: parsedData,
            total: total,
            source: 'js'
        });

    } catch (error: any) {
        console.error('Search API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}
