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

export async function generateMetadata({ params }: { params: { storeSlug: string } }): Promise<Metadata> {
    return {
        title: 'Products',
        description: 'Browse our collection of products.',
    };
}

export default async function ProductsPage({ params }: { params: { storeSlug: string } }) {
    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) return notFound();

    // Fetch Store
    const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, name, logo_url, description, currency, settings, slug')
        .eq('slug', params.storeSlug)
        .eq('status', 'active')
        .single();

    if (storeError || !store) {
        return notFound();
    }

    // Fetch all data in parallel to reduce total request time
    const [categoriesRes, productsRes, headerCategoriesRes, activeThemeRes] = await Promise.all([
        supabaseAdmin
            .from('categories')
            .select('id, name, parent_id')
            .eq('store_id', store.id)
            .eq('status', 'active')
            .order('sort_order'),
        supabaseAdmin
            .from('products')
            .select('id, name, price, compare_at_price, images')
            .eq('store_id', store.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(50),
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

    const categories = categoriesRes.data?.map(c => ({
        ...c,
        name: typeof c.name === 'string' ? JSON.parse(c.name) : c.name,
    })) || [];

    const products = productsRes.data?.map(p => ({
        ...p,
        name: typeof p.name === 'string' ? JSON.parse(p.name) : p.name,
        images: typeof p.images === 'string' ? JSON.parse(p.images) : (Array.isArray(p.images) ? (p.images as string[]) : []),
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

    const activeTheme = activeThemeRes.data;
    const homeOverride = activeTheme?.store_theme_templates?.find((o: any) => o.page_type === 'home')?.settings_data;
    const themeName = (activeTheme?.theme_versions as any)?.themes?.folder_name || 'default';

    const DEFAULT_PRODUCTS_PAGE_DATA = {
        sections_order: ['header_1', 'main_products_1', 'footer_1'],
        sections_data: {
            'header_1': { type: 'header', settings: { notice_text: '🔥 شحن مجاني للطلبات فوق 200 ريال!', search_placeholder: 'ابحث عن منتج...' }, blocks: [{ type: 'link', settings: { label: 'الرئيسية', url: '/' } }, { type: 'link', settings: { label: 'كل المنتجات', url: '/products' } }] },
            'main_products_1': { type: 'main_products', settings: {}, blocks: [] },
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

    let initialPageData = DEFAULT_PRODUCTS_PAGE_DATA;

    let globalHeaderId = 'header_1';
    let globalFooterId = 'footer_1';
    let globalHeaderData = DEFAULT_PRODUCTS_PAGE_DATA.sections_data['header_1'];
    let globalFooterData = DEFAULT_PRODUCTS_PAGE_DATA.sections_data['footer_1'];

    if (homeOverride?.sections_order) {
        globalHeaderId = homeOverride.sections_order.find((id: string) => homeOverride.sections_data[id]?.type === 'header') || 'header_1';
        globalFooterId = homeOverride.sections_order.find((id: string) => homeOverride.sections_data[id]?.type === 'footer') || 'footer_1';
        if (homeOverride.sections_data[globalHeaderId]) globalHeaderData = homeOverride.sections_data[globalHeaderId];
        if (homeOverride.sections_data[globalFooterId]) globalFooterData = homeOverride.sections_data[globalFooterId];
    }

    initialPageData.sections_order = [globalHeaderId, 'main_products_1', globalFooterId];
    // @ts-ignore
    initialPageData.sections_data[globalHeaderId] = globalHeaderData;
    // @ts-ignore
    initialPageData.sections_data[globalFooterId] = globalFooterData;

    const initialTokens = activeTheme?.global_tokens ? activeTheme.global_tokens : DEFAULT_GLOBAL_TOKENS;

    const storeContext = {
        store: parsedStore,
        headerCategories: parsedHeaderCategories,
        productsContext: {
            store: parsedStore,
            initialCategories: categories,
            initialProducts: products
        }
    };

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

