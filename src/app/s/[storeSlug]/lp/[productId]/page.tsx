import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { LandingPageRenderer } from '@/components/landing-pages/LandingPageRenderer';
import type { LandingTemplate } from '@/components/landing-pages/LandingPageRenderer';
import { Metadata } from 'next';
import { cache } from 'react';

export const revalidate = 60;

const getAdminClient = cache(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
});

export async function generateMetadata({
    params,
}: {
    params: { storeSlug: string; productId: string };
}): Promise<Metadata> {
    try {
        const supabase = getAdminClient();
        if (!supabase) return {};

        const { data: store } = await supabase.from('stores').select('id').eq('slug', params.storeSlug).single();
        if (!store) return {};

        const { data: lp } = await supabase
            .from('product_landing_pages')
            .select('content, product_id')
            .eq('product_id', params.productId)
            .eq('is_enabled', true)
            .maybeSingle();

        const { data: product } = await supabase
            .from('products')
            .select('name, images')
            .eq('id', params.productId)
            .single();

        if (!product) return {};

        const name = typeof product.name === 'string' ? JSON.parse(product.name) : product.name;
        const headline = lp?.content?.headline;
        const title = headline?.ar || headline?.en || name?.ar || name?.en || 'Product';

        let images: string[] = [];
        try {
            images = typeof product.images === 'string' ? JSON.parse(product.images) : (Array.isArray(product.images) ? product.images : []);
        } catch { images = []; }

        const heroImage = lp?.content?.hero_image || images[0];

        return {
            title,
            openGraph: { images: heroImage ? [heroImage] : [] },
        };
    } catch {
        return {};
    }
}

export default async function LandingPage({
    params,
}: {
    params: { storeSlug: string; productId: string };
}) {
    const supabase = getAdminClient();
    if (!supabase) return notFound();

    // Fetch store
    const { data: store } = await supabase
        .from('stores')
        .select('id, name, slug, currency')
        .eq('slug', params.storeSlug)
        .single();
    if (!store) return notFound();

    // Fetch landing page data
    const { data: lp } = await supabase
        .from('product_landing_pages')
        .select('*')
        .eq('product_id', params.productId)
        .eq('store_id', store.id)
        .eq('is_enabled', true)
        .maybeSingle();

    if (!lp) return notFound();

    // Fetch product
    const { data: productRaw } = await supabase
        .from('products')
        .select('id, name, price, sale_price, images, currency')
        .eq('id', params.productId)
        .eq('store_id', store.id)
        .eq('status', 'active')
        .single();

    if (!productRaw) return notFound();

    let parsedImages: string[] = [];
    try {
        parsedImages = typeof productRaw.images === 'string' ? JSON.parse(productRaw.images) : (Array.isArray(productRaw.images) ? productRaw.images : []);
    } catch { parsedImages = []; }

    const product = {
        name: typeof productRaw.name === 'string' ? JSON.parse(productRaw.name) : productRaw.name,
        price: productRaw.price,
        sale_price: productRaw.sale_price || undefined,
        currency: productRaw.currency || store.currency || 'SAR',
        images: parsedImages,
    };

    return (
        <LandingPageRenderer
            template={(lp.template as LandingTemplate) || 'hype'}
            content={lp.content || {}}
            product={product}
            language="ar"
            storeSlug={params.storeSlug}
            productId={params.productId}
        />
    );
}
