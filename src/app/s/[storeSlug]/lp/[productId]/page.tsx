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
    params: Promise<{ storeSlug: string; productId: string }>;
}): Promise<Metadata> {
    try {
        const { storeSlug, productId } = await params;
        const supabase = getAdminClient();
        if (!supabase) return {};

        // 1. Fetch Store
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('id')
            .ilike('slug', storeSlug)
            .maybeSingle();

        if (storeError || !store) {
            console.error(`[LP Metadata] Store not found for slug: ${storeSlug}`, storeError);
            return {};
        }

        // 2. Fetch Landing Page
        const { data: lp, error: lpError } = await supabase
            .from('product_landing_pages')
            .select('content, product_id')
            .eq('product_id', productId)
            .eq('is_enabled', true)
            .maybeSingle();

        if (lpError) {
            console.error(`[LP Metadata] Error fetching landing page for ${productId}`, lpError);
        }

        // 3. Fetch Product
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('name, images')
            .eq('id', productId)
            .maybeSingle();

        if (productError || !product) {
            console.error(`[LP Metadata] Product not found for id: ${productId}`, productError);
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
    params: Promise<{ storeSlug: string; productId: string }>;
    searchParams: Promise<{ preview?: string }>;
}) {
    const { storeSlug, productId } = await params;
    const { preview: previewParam } = await searchParams;
    const isPreview = previewParam === 'true';
    const supabase = getAdminClient();
    
    // Debug helper to show exactly what's failing
    let debugData = {
        storeFound: false,
        productFound: false,
        lpFound: false,
        lpRecordFoundButDisabled: false,
        error: null as any
    };

    if (!supabase) {
        return <div className="p-10 text-red-500">CRITICAL: Supabase Admin Client could not be initialized. Check environment variables.</div>;
    }

    try {
        // 1. Fetch Product FIRST (most specific)
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, name, price, sale_price, images, currency, store_id, status')
            .eq('id', productId)
            .maybeSingle();

        if (product) debugData.productFound = true;
        if (productError) debugData.error = productError;

        // 2. Fetch Store
        const { data: store } = await supabase
            .from('stores')
            .select('id, name, slug, currency')
            .ilike('slug', storeSlug)
            .maybeSingle();
        
        if (store) debugData.storeFound = true;

        // 3. Fetch Landing Page
        let lpQuery = supabase
            .from('product_landing_pages')
            .select('*')
            .eq('product_id', productId);
        
        const { data: lp } = await lpQuery.maybeSingle();
        if (lp) {
            debugData.lpRecordFoundButDisabled = !lp.is_enabled;
            // Only consider it "Found" if it's enabled OR we are in preview mode
            if (lp.is_enabled || isPreview) {
                debugData.lpFound = true;
            }
        }

        // If everything is found, render the page
        if (debugData.lpFound && debugData.productFound && debugData.storeFound) {
            // Ultra-Safe parsing helper
            const safeParse = (val: any, fallback: any) => {
                if (!val) return fallback;
                if (typeof val === 'string') {
                    try { return JSON.parse(val); } catch (e) { return fallback; }
                }
                return val;
            };

            const rawName = safeParse(product!.name, { ar: 'منتج', en: 'Product' });
            const rawImages = safeParse(product!.images, []);
            const rawContent = lp!.content || {};

            const productData = {
                name: {
                    ar: String(rawName.ar || 'منتج'),
                    en: String(rawName.en || 'Product')
                },
                price: parseFloat(String(product!.price || 0)) || 0,
                sale_price: product!.sale_price ? (parseFloat(String(product!.sale_price)) || undefined) : undefined,
                currency: String(product!.currency || store!.currency || 'SAR').replace(/[^a-zA-Z]/g, ''),
                images: Array.isArray(rawImages) ? rawImages.map(img => String(img)) : []
            };

            const safeContent = {
                ...rawContent,
                headline: { ar: rawContent.headline?.ar || '', en: rawContent.headline?.en || '' },
                subheadline: { ar: rawContent.subheadline?.ar || '', en: rawContent.subheadline?.en || '' },
                cta_text: { ar: rawContent.cta_text?.ar || 'اطلب الآن', en: rawContent.cta_text?.en || 'Order Now' },
                benefits: rawContent.benefits || [],
                testimonials: rawContent.testimonials || [],
                guarantee_text: { ar: rawContent.guarantee_text?.ar || '', en: rawContent.guarantee_text?.en || '' },
                hero_image: rawContent.hero_image || '',
                accent_color: rawContent.accent_color || '#2563EB'
            };

            return (
                <LandingPageRenderer
                    template={(lp!.template as any) || 'hype'}
                    content={safeContent}
                    product={productData}
                    language="ar"
                    storeSlug={storeSlug}
                    productId={productId}
                    isPreview={isPreview}
                />
            );
        }

        // Otherwise show our advanced 404 Debug page
        return (
            <div className="min-h-screen flex items-center justify-center bg-white p-6 text-center" dir="rtl">
                <div className="max-w-lg w-full space-y-6">
                    <div className="text-8xl font-black text-gray-100">404</div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-gray-900">عذراً، لم نتمكن من العثور على هذه الصفحة</h1>
                        <p className="text-gray-500">قد يكون الرابط غير صحيح أو أن الصفحة غير مفعّلة حالياً من لوحة التحكم.</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-right space-y-3">
                        <h3 className="font-bold text-blue-900 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            حالة البيانات (التشخيص):
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li className="flex justify-between items-center">
                                <span className="text-gray-600">البحث عن المتجر ({storeSlug}):</span>
                                <span className={debugData.storeFound ? "text-green-600 font-bold" : "text-red-500"}>
                                    {debugData.storeFound ? "✅ وُجد" : "❌ لم يوجد"}
                                </span>
                            </li>
                            <li className="flex justify-between items-center">
                                <span className="text-gray-600">البحث عن المنتج:</span>
                                <span className={debugData.productFound ? "text-green-600 font-bold" : "text-red-500"}>
                                    {debugData.productFound ? "✅ وُجد" : "❌ لم يوجد"}
                                </span>
                            </li>
                            <li className="flex justify-between items-center">
                                <span className="text-gray-600">سجل صفحة الهبوط:</span>
                                <span className={debugData.lpRecordFoundButDisabled || debugData.lpFound ? "text-green-600 font-bold" : "text-red-500"}>
                                    {debugData.lpFound ? "✅ مفعلة" : debugData.lpRecordFoundButDisabled ? "⚠️ موجودة ولكن معطلة" : "❌ غير موجودة"}
                                </span>
                            </li>
                        </ul>
                        
                        <div className="mt-4 pt-4 border-t border-blue-100 flex flex-col gap-1 text-[10px] font-mono text-blue-400 opacity-60">
                            <p>Store ID: {store?.id || "N/A"}</p>
                            <p>Product ID: {productId}</p>
                            {debugData.error && <p className="text-red-400">DB Error: {JSON.stringify(debugData.error)}</p>}
                        </div>
                    </div>

                    <button 
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                        تحديث الصفحة
                    </button>
                </div>
            </div>
        );

    } catch (e: any) {
        return (
            <div className="p-10 bg-red-50 text-red-700 rounded-lg">
                <h1 className="font-bold">Server Error during fetch:</h1>
                <pre className="mt-2 text-xs">{e.message}</pre>
            </div>
        );
    }
}
