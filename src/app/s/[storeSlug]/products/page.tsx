import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { StoreProducts } from '@/components/store/StoreProducts';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { storeSlug: string } }): Promise<Metadata> {
    return {
        title: 'Products',
        description: 'Browse our collection of products.',
    };
}

export default async function ProductsPage({ params }: { params: { storeSlug: string } }) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    );

    // Fetch Store
    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, currency, slug')
        .eq('slug', params.storeSlug)
        .eq('status', 'active')
        .single();

    if (storeError || !store) {
        return notFound();
    }

    // Parallel Fetch Categories and Initial Products (All)
    const [categoriesRes, productsRes] = await Promise.all([
        supabase
            .from('categories')
            .select('id, name, parent_id')
            .eq('store_id', store.id)
            .eq('status', 'active')
            .order('sort_order'),
        supabase
            .from('products')
            .select('id, name, price, compare_at_price, images')
            .eq('store_id', store.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(50), // Optimization: Limit initial fetch for SSR, client can load more or filter
    ]);

    const categories = categoriesRes.data?.map(c => ({
        ...c,
        name: typeof c.name === 'string' ? JSON.parse(c.name) : c.name,
    })) || [];

    const products = productsRes.data?.map(p => ({
        ...p,
        name: typeof p.name === 'string' ? JSON.parse(p.name) : p.name,
        images: Array.isArray(p.images) ? (p.images as string[]) : [],
    })) || [];

    return (
        <StoreProducts
            store={store}
            initialCategories={categories}
            initialProducts={products}
        />
    );
}
