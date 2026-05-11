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
        const resolvedParams = await params;
        const storeSlug = resolvedParams?.storeSlug;
        const productId = resolvedParams?.productId;
        
        if (!storeSlug || !productId) return { title: 'Product' };

        const supabase = getAdminClient();
        if (!supabase) return { title: 'Product' };

        // 1. Fetch Product
        const { data: product } = await supabase
            .from('products')
            .select('name, images')
            .eq('id', productId)
            .maybeSingle();

        if (!product) return { title: 'Product' };

        // 2. Fetch Landing Page
        const { data: lp } = await supabase
            .from('product_landing_pages')
            .select('content')
            .eq('product_id', productId)
            .eq('is_enabled', true)
            .maybeSingle();

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
            openGraph: { 
                title,
                images: heroImage ? [heroImage] : [] 
            },
        };
    } catch (e) {
        console.error("[LP Metadata] Error:", e);
        return { title: 'Product' };
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

    // Pre-calculate all data outside the main try block to ensure we can catch failures
    let store: any = null;
    let product: any = null;
    let lp: any = null;
    let productError: any = null;

    try {
        // 1. Fetch Product
        const { data: pData, error: pError } = await supabase
            .from('products')
            .select('id, name, price, sale_price, images, store_id, status')
            .eq('id', productId)
            .maybeSingle();
        
        product = pData;
        productError = pError;
        if (product) debugData.productFound = true;
        if (productError) debugData.error = productError;

        // 2. Fetch Store
        const { data: sData } = await supabase
            .from('stores')
            .select('id, name, slug, currency')
            .ilike('slug', storeSlug)
            .maybeSingle();
        
        store = sData;
        if (store) debugData.storeFound = true;

        // 3. Fetch Landing Page
        const { data: lpData } = await supabase
            .from('product_landing_pages')
            .select('*')
            .eq('product_id', productId)
            .maybeSingle();
        
        lp = lpData;
        if (lp) {
            debugData.lpRecordFoundButDisabled = !lp.is_enabled;
            if (lp.is_enabled || isPreview) {
                debugData.lpFound = true;
            }
        }

        // If everything is found, render the page
        if (debugData.lpFound && product && store) {
            const safeParse = (val: any, fallback: any) => {
                if (!val) return fallback;
                if (typeof val === 'string') {
                    try { return JSON.parse(val); } catch (e) { return fallback; }
                }
                return val;
            };

            const rawName = safeParse(product.name, { ar: 'منتج', en: 'Product' });
            const rawImages = safeParse(product.images, []);
            const rawContent = lp.content || {};

            // STICK TO PLAIN PRIMITIVES FOR SERIALIZATION SAFETY
            const productData = {
                name: {
                    ar: String(rawName.ar || 'منتج'),
                    en: String(rawName.en || 'Product')
                },
                price: Number(product.price || 0),
                sale_price: product.sale_price ? Number(product.sale_price) : undefined,
                currency: String(product.currency || store.currency || 'SAR').replace(/[^a-zA-Z]/g, ''),
                images: Array.isArray(rawImages) ? rawImages.map(img => String(img)) : []
            };

            const safeContent = {
                headline: { 
                    ar: String(rawContent.headline?.ar || ''), 
                    en: String(rawContent.headline?.en || '') 
                },
                subheadline: { 
                    ar: String(rawContent.subheadline?.ar || ''), 
                    en: String(rawContent.subheadline?.en || '') 
                },
                cta_text: { 
                    ar: String(rawContent.cta_text?.ar || 'اطلب الآن'), 
                    en: String(rawContent.cta_text?.en || 'Order Now') 
                },
                benefits: Array.isArray(rawContent.benefits) ? rawContent.benefits : [],
                testimonials: Array.isArray(rawContent.testimonials) ? rawContent.testimonials : [],
                guarantee_text: { 
                    ar: String(rawContent.guarantee_text?.ar || ''), 
                    en: String(rawContent.guarantee_text?.en || '') 
                },
                hero_image: String(rawContent.hero_image || ''),
                accent_color: String(rawContent.accent_color || '#2563EB')
            };

            return (
                <LandingPageRenderer
                    template={String(lp.template || 'hype') as any}
                    content={safeContent}
                    product={productData}
                    language="ar"
                    storeSlug={String(storeSlug)}
                    productId={String(productId)}
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
                            {debugData.error && <p className="text-red-400">DB Error: {typeof debugData.error === 'object' ? JSON.stringify(debugData.error) : String(debugData.error)}</p>}
                        </div>
                    </div>

                    <a 
                        href={`/lp/${productId}`}
                        className="px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors inline-block text-center"
                    >
                        تحديث الصفحة
                    </a>
                </div>
            </div>
        );

    } catch (e: any) {
        console.error("[LP Page] Critical Crash:", e);
        return (
            <div className="p-10 bg-red-50 text-red-700 rounded-lg max-w-2xl mx-auto mt-20 shadow-xl border border-red-100" dir="ltr">
                <h1 className="font-bold text-xl mb-4">Critical Server Error</h1>
                <div className="bg-white p-4 rounded border border-red-200 font-mono text-sm overflow-auto">
                    <p className="font-bold text-red-600">{e.name}: {e.message}</p>
                    {e.stack && <pre className="mt-2 text-[10px] opacity-60">{e.stack}</pre>}
                </div>
                <div className="mt-6 flex gap-4">
                    <a href={`/lp/${productId}`} className="px-4 py-2 bg-red-600 text-white rounded text-sm">Retry Load</a>
                    <a href="/" className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm">Back Home</a>
                </div>
            </div>
        );
    }
}
