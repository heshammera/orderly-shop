import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import ThemePreviewManager from '@/components/ThemeEngine/ThemePreviewManager';
import { Metadata } from 'next';
import { cache } from 'react';

export const revalidate = 60; // Cache for 60 seconds to reduce server load

const getAdminClient = cache(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
});

export async function generateMetadata({ params }: { params: { storeSlug: string, productSlug: string } }): Promise<Metadata> {
    try {
        const supabaseAdmin = getAdminClient();
        if (!supabaseAdmin) return {};

        const { data: store } = await supabaseAdmin.from('stores').select('id').eq('slug', params.storeSlug).single();
        if (!store) return {};

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.productSlug);

        let query = supabaseAdmin
            .from('products')
            .select('name, description, images')
            .eq('store_id', store.id);

        if (isUuid) {
            query = query.eq('id', params.productSlug);
        } else {
            query = query.eq('sku', params.productSlug);
        }

        const { data: product } = await query.single();

        if (!product) return {};

        const name = typeof product.name === 'string' ? JSON.parse(product.name) : product.name;
        const desc = typeof product.description === 'string' ? JSON.parse(product.description) : product.description;
        let images: string[] = [];
        try {
            images = typeof product.images === 'string' ? (JSON.parse(product.images) as string[]) : (Array.isArray(product.images) ? (product.images as string[]) : []);
        } catch {
            images = [];
        }

        return {
            title: name?.en || name?.ar || 'Product',
            description: desc?.en || desc?.ar || '',
            openGraph: {
                images: images.length > 0 ? [images[0]] : [],
            },
        };
    } catch (e) {
        console.error('[ProductPage] generateMetadata error:', e);
        return {};
    }
}

export default async function ProductPage({ params }: { params: { storeSlug: string, productSlug: string } }) {
    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) return notFound();

    // Fetch Store by Slug to get details + settings
    const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, name, logo_url, description, currency, settings, slug')
        .eq('slug', params.storeSlug)
        .single();

    if (storeError || !store) {
        return notFound();
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.productSlug);

    let productQuery = supabaseAdmin
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('status', 'active');

    if (isUuid) {
        productQuery = productQuery.eq('id', params.productSlug);
    } else {
        productQuery = productQuery.eq('sku', params.productSlug);
    }

    const { data: productResData, error: productError } = await productQuery.single();

    if (productError || !productResData) {
        return notFound();
    }

    const actualProductId = productResData.id;

    // Fetch ALL OTHER data in parallel to reduce total request time
    const [variantsRes, upsellRes, headerCategoriesRes, activeThemeRes] = await Promise.all([
        supabaseAdmin
            .from('product_variants')
            .select('*, variant_options(*)')
            .eq('product_id', actualProductId)
            .order('sort_order'),
        supabaseAdmin
            .from('upsell_offers')
            .select('*')
            .eq('product_id', actualProductId)
            .eq('is_active', true)
            .order('min_quantity'),
        supabaseAdmin
            .from('categories')
            .select('id, name')
            .eq('store_id', store.id)
            .eq('status', 'active')
            .eq('show_in_header', true)
            .order('sort_order'),
        supabaseAdmin
            .from('store_themes')
            .select(`
                id,
                global_tokens,
                store_theme_templates (page_type, settings_data),
                theme_versions (themes (folder_name))
            `)
            .eq('store_id', store.id)
            .eq('is_active', true)
            .maybeSingle(),
    ]);

    // Parse Data
    let parsedImages: string[] = [];
    try {
        parsedImages = typeof productResData.images === 'string' ? (JSON.parse(productResData.images) as string[]) : (Array.isArray(productResData.images) ? (productResData.images as string[]) : []);
    } catch {
        parsedImages = [];
    }

    const product = {
        ...productResData,
        name: typeof productResData.name === 'string' ? JSON.parse(productResData.name) : productResData.name,
        description: typeof productResData.description === 'string' ? JSON.parse(productResData.description) : productResData.description || { ar: '', en: '' },
        images: parsedImages,
        ignore_stock: productResData.ignore_stock || false,
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
            price: o.price,
            stock: o.stock,
            manage_stock: o.manage_stock,
            is_default: o.is_default,
            in_stock: o.in_stock !== false,
        })),
    })) || [];

    const upsellOffers = upsellRes.data?.map((u: any) => ({
        ...u,
        discount_type: u.discount_type,
        label: typeof u.label === 'string' ? JSON.parse(u.label) : u.label || { ar: '', en: '' },
        badge: typeof u.badge === 'string' ? JSON.parse(u.badge) : u.badge || { ar: '', en: '' },
    })) || [];

    const parsedHeaderCategories = headerCategoriesRes.data?.map(c => ({
        ...c,
        name: typeof c.name === 'string' ? JSON.parse(c.name) : c.name,
    })) || [];

    // Parse JSON fields safely
    const parsedStore = {
        ...store,
        name: typeof store.name === 'string' ? JSON.parse(store.name) : store.name,
        description: typeof store.description === 'string' ? JSON.parse(store.description) : store.description,
    };

    const storeContext = {
        product,
        variants,
        upsellOffers,
        store: parsedStore,
        headerCategories: parsedHeaderCategories
    };

    // Process theme data
    const activeTheme = activeThemeRes.data;
    const homeOverride = activeTheme?.store_theme_templates?.find((o: any) => o.page_type === 'home')?.settings_data;
    const themeName = (activeTheme?.theme_versions as any)?.themes?.folder_name || 'default';
    const productOverride = activeTheme?.store_theme_templates?.find((o: any) => o.page_type === 'product')?.settings_data;

    const DEFAULT_PRODUCT_PAGE_DATA = {
        sections_order: ['header_1', 'main_product_1', 'footer_1'],
        sections_data: {
            'header_1': { type: 'header', settings: { notice_text: '🔥 شحن مجاني للطلبات فوق 200 ريال!', search_placeholder: 'ابحث عن منتج...' }, blocks: [{ type: 'link', settings: { label: 'الرئيسية', url: '/' } }, { type: 'link', settings: { label: 'كل المنتجات', url: '/products' } }] },
            'main_product_1': { type: 'main_product', settings: {}, blocks: [] },
            'footer_1': { type: 'footer', settings: { about_heading: 'عن متجرنا', about_text: 'نقدم أفضل المنتجات.', copyright: 'جميع الحقوق محفوظة' }, blocks: [] }
        }
    };

    const DEFAULT_GLOBAL_TOKENS = {
        'primary': '262.1 83.3% 57.8%',
        'primary-foreground': '210 40% 98%',
        'background': '0 0% 100%',
        'foreground': '222.2 84% 4.9%',
        'radius': '1rem'
    };

    let initialPageData = productOverride?.sections_order ? {
        sections_order: productOverride.sections_order,
        sections_data: productOverride.sections_data || {}
    } : DEFAULT_PRODUCT_PAGE_DATA;

    let globalHeaderId = 'header_1';
    let globalFooterId = 'footer_1';
    let globalHeaderData = DEFAULT_PRODUCT_PAGE_DATA.sections_data['header_1'];
    let globalFooterData = DEFAULT_PRODUCT_PAGE_DATA.sections_data['footer_1'];

    if (homeOverride?.sections_order) {
        globalHeaderId = homeOverride.sections_order.find((id: string) => homeOverride.sections_data[id]?.type === 'header') || 'header_1';
        globalFooterId = homeOverride.sections_order.find((id: string) => homeOverride.sections_data[id]?.type === 'footer') || 'footer_1';
        if (homeOverride.sections_data[globalHeaderId]) globalHeaderData = homeOverride.sections_data[globalHeaderId];
        if (homeOverride.sections_data[globalFooterId]) globalFooterData = homeOverride.sections_data[globalFooterId];
    }

    initialPageData.sections_order = initialPageData.sections_order.filter((id: string) => initialPageData.sections_data[id]?.type !== 'header' && initialPageData.sections_data[id]?.type !== 'footer');
    initialPageData.sections_order = [globalHeaderId, ...initialPageData.sections_order, globalFooterId];
    initialPageData.sections_data[globalHeaderId] = globalHeaderData;
    initialPageData.sections_data[globalFooterId] = globalFooterData;

    const initialTokens = activeTheme?.global_tokens ? activeTheme.global_tokens : DEFAULT_GLOBAL_TOKENS;

    return (
        <main>
            <ThemePreviewManager
                initialPageData={initialPageData}
                initialTokens={initialTokens}
                isRTL={true}
                storeContext={storeContext}
                themeName={themeName}
            />
        </main>
    );
}

