import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { CheckoutPage } from '@/components/store/CheckoutPage';
import ThemePreviewManager from '@/components/ThemeEngine/ThemePreviewManager';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { storeSlug: string } }): Promise<Metadata> {
    return {
        title: 'Checkout',
        description: 'Complete your purchase.',
    };
}

export default async function Page({ params }: { params: { storeSlug: string } }) {
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


    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, currency, settings, slug, name, description')
        .eq('slug', params.storeSlug)
        .eq('status', 'active')
        .single();

    if (storeError || !store) {
        return notFound();
    }

    // Fetch all data in parallel to reduce total request time
    const [headerCategoriesRes, activeThemeRes] = await Promise.all([
        supabase
            .from('categories')
            .select('id, name')
            .eq('store_id', store.id)
            .eq('status', 'active')
            .eq('show_in_header', true)
            .order('sort_order'),
        supabase
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
    const checkoutOverride = activeTheme?.store_theme_templates?.find((o: any) => o.page_type === 'checkout')?.settings_data;

    const DEFAULT_CHECKOUT_PAGE_DATA = {
        sections_order: ['header_1', 'main_checkout_1', 'footer_1'],
        sections_data: {
            'header_1': { type: 'header', settings: { notice_text: '🔥 شحن مجاني للطلبات فوق 200 ريال!', search_placeholder: 'ابحث عن منتج...' }, blocks: [{ type: 'link', settings: { label: 'الرئيسية', url: '/' } }, { type: 'link', settings: { label: 'كل المنتجات', url: '/products' } }] },
            'main_checkout_1': { type: 'main_checkout', settings: {}, blocks: [] },
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

    let initialPageData = checkoutOverride?.sections_order ? {
        sections_order: checkoutOverride.sections_order,
        sections_data: checkoutOverride.sections_data || {}
    } : DEFAULT_CHECKOUT_PAGE_DATA;

    let globalHeaderId = 'header_1';
    let globalFooterId = 'footer_1';
    let globalHeaderData: any = DEFAULT_CHECKOUT_PAGE_DATA.sections_data['header_1'];
    let globalFooterData: any = DEFAULT_CHECKOUT_PAGE_DATA.sections_data['footer_1'];

    if (homeOverride?.sections_order) {
        const foundHeaderId = homeOverride.sections_order.find((id: string) => homeOverride.sections_data[id]?.type === 'header');
        const foundFooterId = homeOverride.sections_order.find((id: string) => homeOverride.sections_data[id]?.type === 'footer');
        globalHeaderId = foundHeaderId || 'header_1';
        globalFooterId = foundFooterId || 'footer_1';
        globalHeaderData = foundHeaderId ? homeOverride.sections_data[foundHeaderId] : null;
        globalFooterData = foundFooterId ? homeOverride.sections_data[foundFooterId] : null;
    }

    initialPageData.sections_order = initialPageData.sections_order.filter((id: string) => initialPageData.sections_data[id]?.type !== 'header' && initialPageData.sections_data[id]?.type !== 'footer');
    if (globalHeaderData) {
        initialPageData.sections_order = [globalHeaderId, ...initialPageData.sections_order];
        initialPageData.sections_data[globalHeaderId] = globalHeaderData;
    }
    if (globalFooterData) {
        initialPageData.sections_order = [...initialPageData.sections_order, globalFooterId];
        initialPageData.sections_data[globalFooterId] = globalFooterData;
    }

    const initialTokens = activeTheme?.global_tokens ? activeTheme.global_tokens : DEFAULT_GLOBAL_TOKENS;

    const storeContext = {
        store: parsedStore,
        headerCategories: parsedHeaderCategories,
        legacyCheckoutSchema: null
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
