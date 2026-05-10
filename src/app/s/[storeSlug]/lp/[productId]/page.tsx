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

        const { data: store } = await supabase.from('stores').select('id').ilike('slug', params.storeSlug).single();
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
    searchParams,
}: {
    params: { storeSlug: string; productId: string };
    searchParams: { preview?: string };
}) {
    const isPreview = searchParams.preview === 'true';
    const supabase = getAdminClient();
    if (!supabase) return notFound();

    // Fetch store
    const { data: store } = await supabase
        .from('stores')
        .select('id, name, slug, currency')
        .ilike('slug', params.storeSlug) // Case-insensitive lookup
        .single();
    if (!store) {
        console.error(`[LandingPage] Store not found for slug: ${params.storeSlug}`);
        return notFound();
    }

    let lpQuery = supabase
        .from('product_landing_pages')
        .select('*')
        .eq('product_id', params.productId)
        .eq('store_id', store.id);
    
    if (!isPreview) {
        lpQuery = lpQuery.eq('is_enabled', true);
    }

    const { data: lp } = await lpQuery.maybeSingle();

    if (!lp) {
        // Log more details to help merchant debug
        const { data: rawLp } = await supabase
            .from('product_landing_pages')
            .select('id, is_enabled')
            .eq('product_id', params.productId)
            .maybeSingle();
        
        if (!rawLp) {
            console.error(`[LandingPage] No record found in product_landing_pages for productId: ${params.productId}`);
        } else if (!rawLp.is_enabled && !isPreview) {
            console.error(`[LandingPage] Landing page found but is_enabled is FALSE for productId: ${params.productId}. (Accessing without preview=true)`);
        }
        return notFound();
    }

    // Fetch product
    let productQuery = supabase
        .from('products')
        .select('id, name, price, sale_price, images, currency')
        .eq('id', params.productId)
        .eq('store_id', store.id);

    if (!isPreview) {
        productQuery = productQuery.eq('status', 'active');
    }

    const { data: productRaw } = await productQuery.single();

    if (!productRaw) {
        console.error(`[LandingPage] Product not found or not active for productId: ${params.productId}${isPreview ? ' (Preview mode)' : ''}`);
        return notFound();
    }

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
