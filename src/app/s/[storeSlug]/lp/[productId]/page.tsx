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

        // 1. Fetch Store
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('id')
            .ilike('slug', params.storeSlug)
            .maybeSingle();

        if (storeError || !store) {
            console.error(`[LP Metadata] Store not found for slug: ${params.storeSlug}`, storeError);
            return {};
        }

        // 2. Fetch Landing Page
        const { data: lp, error: lpError } = await supabase
            .from('product_landing_pages')
            .select('content, product_id')
            .eq('product_id', params.productId)
            .eq('is_enabled', true)
            .maybeSingle();

        if (lpError) {
            console.error(`[LP Metadata] Error fetching landing page for ${params.productId}`, lpError);
        }

        // 3. Fetch Product
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('name, images')
            .eq('id', params.productId)
            .maybeSingle();

        if (productError || !product) {
            console.error(`[LP Metadata] Product not found for id: ${params.productId}`, productError);
            return {};
        }

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
        .maybeSingle();
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
        
        console.error(`[LandingPage] No record found in product_landing_pages for productId: ${params.productId}`, {
            storeId: store.id,
            slug: params.storeSlug
        });

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center" dir="rtl">
                <div className="max-w-md space-y-4">
                    <h1 className="text-6xl font-bold text-gray-200">404</h1>
                    <h2 className="text-2xl font-bold text-gray-800">عذراً، هذه الصفحة غير متاحة حالياً</h2>
                    <p className="text-gray-600">تأكد من تفعيل صفحة الهبوط من لوحة التحكم والضغط على زر "حفظ" أولاً.</p>
                    
                    {/* Debug info - only visible to admins/merchants if we had a way to check, 
                        but here we'll show it small to help us find the issue */}
                    <div className="mt-8 pt-8 border-t text-[10px] text-gray-400 font-mono text-left opacity-30">
                        <p>DEBUG INFO:</p>
                        <p>Store ID: {store.id}</p>
                        <p>Store Slug: {params.storeSlug}</p>
                        <p>Product ID: {params.productId}</p>
                        <p>Status: {rawLp ? "Disabled" : "Not Found"}</p>
                    </div>
                </div>
            </div>
        );
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

    const { data: productRaw } = await productQuery.maybeSingle();

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
