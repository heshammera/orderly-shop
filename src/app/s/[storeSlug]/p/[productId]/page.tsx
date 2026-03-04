import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import ThemePreviewManager from '@/components/ThemeEngine/ThemePreviewManager';
import { Metadata } from 'next';

export const revalidate = 0;

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
    let parsedImages: string[] = [];
    try {
        parsedImages = typeof productRes.data.images === 'string' ? (JSON.parse(productRes.data.images) as string[]) : (Array.isArray(productRes.data.images) ? (productRes.data.images as string[]) : []);
    } catch {
        parsedImages = [];
    }

    const product = {
        ...productRes.data,
        name: typeof productRes.data.name === 'string' ? JSON.parse(productRes.data.name) : productRes.data.name,
        description: typeof productRes.data.description === 'string' ? JSON.parse(productRes.data.description) : productRes.data.description || { ar: '', en: '' },
        images: parsedImages,
        ignore_stock: productRes.data.ignore_stock || false,
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

    const storeContext = {
        product,
        variants,
        upsellOffers,
        store
    };

    // Fetch Active Theme and Overrides for 'product' and 'home' templates
    const { data: activeTheme } = await supabase
        .from('store_themes')
        .select(`
            id,
            global_tokens,
            store_theme_templates (page_type, settings_data),
            theme_versions (themes (folder_name))
        `)
        .eq('store_id', store.id)
        .eq('is_active', true)
        .maybeSingle();

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
