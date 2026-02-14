import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/store/ProductDetail';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { storeSlug: string, productId: string } }): Promise<Metadata> {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    );

    const { data: product } = await supabase
        .from('products')
        .select('name, description, images')
        .eq('id', params.productId)
        .single();

    if (!product) return {};

    const name = typeof product.name === 'string' ? JSON.parse(product.name) : product.name;
    const desc = typeof product.description === 'string' ? JSON.parse(product.description) : product.description;
    const images = Array.isArray(product.images) ? product.images : [];

    return {
        title: name?.en || name?.ar || 'Product',
        description: desc?.en || desc?.ar || '',
        openGraph: {
            images: images.length > 0 ? [images[0]] : [],
        },
    };
}

export default async function ProductPage({ params }: { params: { storeSlug: string, productId: string } }) {
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

    // Fetch Store by Slug to get details + settings
    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, currency, settings, slug')
        .eq('slug', params.storeSlug)
        .single();

    if (storeError || !store) {
        return notFound();
    }

    // Parallel Fetch Product, Variants, Upsells
    const [productRes, variantsRes, upsellRes] = await Promise.all([
        supabase
            .from('products')
            .select('*')
            .eq('id', params.productId)
            .eq('store_id', store.id)
            .eq('status', 'active')
            .single(),
        supabase
            .from('product_variants')
            .select('*, variant_options(*)')
            .eq('product_id', params.productId)
            .order('sort_order'),
        supabase
            .from('upsell_offers')
            .select('*')
            .eq('product_id', params.productId)
            .eq('is_active', true)
            .order('min_quantity'),
    ]);

    if (!productRes.data) {
        return notFound();
    }

    // Parse Data
    const product = {
        ...productRes.data,
        name: typeof productRes.data.name === 'string' ? JSON.parse(productRes.data.name) : productRes.data.name,
        description: typeof productRes.data.description === 'string' ? JSON.parse(productRes.data.description) : productRes.data.description || { ar: '', en: '' },
        images: Array.isArray(productRes.data.images) ? (productRes.data.images as string[]) : [],
    };

    const variants = variantsRes.data?.map((v: any) => ({
        id: v.id,
        name: typeof v.name === 'string' ? JSON.parse(v.name) : v.name,
        display_type: v.display_type,
        option_type: v.option_type,
        required: v.required,
        options: (v.variant_options || []).map((o: any) => ({
            id: o.id,
            label: typeof o.label === 'string' ? JSON.parse(o.label) : o.label,
            value: o.value,
            price_modifier: o.price_modifier,
            is_default: o.is_default,
        })),
    })) || [];

    const upsellOffers = upsellRes.data?.map((u: any) => ({
        ...u,
        discount_type: u.discount_type,
        label: typeof u.label === 'string' ? JSON.parse(u.label) : u.label || { ar: '', en: '' },
        badge: typeof u.badge === 'string' ? JSON.parse(u.badge) : u.badge || { ar: '', en: '' },
    })) || [];

    return (
        <ProductDetail
            product={product}
            variants={variants}
            upsellOffers={upsellOffers}
            store={store}
        />
    );
}
