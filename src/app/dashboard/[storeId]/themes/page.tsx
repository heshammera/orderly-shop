"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Palette, MonitorPlay, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ThemesPage({ params }: { params: { storeId: string } }) {
    const { storeId } = params;
    const { language } = useLanguage();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [activeTheme, setActiveTheme] = useState<any>(null);
    const [availableThemes, setAvailableThemes] = useState<any[]>([]);

    const fetchThemesData = async () => {
        setLoading(true);
        try {
            // 1. Fetch available themes from the platform
            const { data: themesData, error: themesError } = await supabase
                .from('themes')
                .select('*, theme_versions(*)')
                .order('created_at', { ascending: true });

            if (themesError) throw themesError;

            // 2. Fetch the store's active theme
            const { data: storeThemeData, error: storeThemeError } = await supabase
                .from('store_themes')
                .select(`
                    *,
                    theme_versions (
                        *,
                        themes (*)
                    )
                `)
                .eq('store_id', storeId)
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();

            if (storeThemeError && storeThemeError.code !== 'PGRST116') {
                throw storeThemeError;
            }

            setAvailableThemes(themesData || []);
            setActiveTheme(storeThemeData || null);

        } catch (error: any) {
            console.error('Error fetching themes:', error);
            toast.error(language === 'ar' ? 'فشل تحميل الثيمات' : 'Failed to load themes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchThemesData();
    }, [storeId, supabase]);

    const activateTheme = async (themeVersionId: string) => {
        try {
            toast.loading(language === 'ar' ? 'جاري تفعيل الثيم...' : 'Activating theme...', { id: 'activate-theme' });

            // First, deactivate all current themes for this store
            const { data: currentActive } = await supabase
                .from('store_themes')
                .select('id')
                .eq('store_id', storeId)
                .eq('is_active', true);

            if (currentActive && currentActive.length > 0) {
                for (const active of currentActive) {
                    await supabase.from('store_themes').update({ is_active: false }).eq('id', active.id);
                }
            }

            // Check if this store already has a record for this theme version
            const { data: existingRecords } = await supabase
                .from('store_themes')
                .select('id')
                .eq('store_id', storeId)
                .eq('theme_version_id', themeVersionId)
                .limit(1);

            const existingRecord = existingRecords?.[0] || null;

            const themeObj = availableThemes.find(t => t.theme_versions?.some((v: any) => v.id === themeVersionId));
            const folderName = themeObj?.folder_name || 'default';

            if (existingRecord) {
                // Reactivate existing
                await supabase
                    .from('store_themes')
                    .update({ is_active: true })
                    .eq('id', existingRecord.id);

                // Ensure templates exist
                const { data: existingTemplates } = await supabase
                    .from('store_theme_templates')
                    .select('page_type')
                    .eq('store_theme_id', existingRecord.id);

                const existingPageTypes = (existingTemplates || []).map((t: any) => t.page_type);
                const missingTemplates: any[] = [];

                if (!existingPageTypes.includes('home')) {
                    missingTemplates.push({ store_theme_id: existingRecord.id, page_type: 'home', settings_data: null });
                }
                if (!existingPageTypes.includes('product')) {
                    missingTemplates.push({ store_theme_id: existingRecord.id, page_type: 'product', settings_data: null });
                }
                if (!existingPageTypes.includes('checkout')) {
                    missingTemplates.push({ store_theme_id: existingRecord.id, page_type: 'checkout', settings_data: null });
                }

                if (missingTemplates.length > 0) {
                    await supabase.from('store_theme_templates').insert(missingTemplates);
                }
            } else {
                // Create new store_theme record
                const { data: newThemeRecord, error: insertError } = await supabase
                    .from('store_themes')
                    .insert({
                        store_id: storeId,
                        theme_version_id: themeVersionId,
                        is_active: true
                    })
                    .select('id')
                    .single();

                if (insertError) throw insertError;

                // Seed default overrides for the new theme so it renders correctly
                if (newThemeRecord) {
                    // Niche specific defaults mapping
                    const nicheDefaults: Record<string, any> = {
                        technova: { hero: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1600&q=80', cat1: 'https://images.unsplash.com/photo-1511740947509-1ee0c7b59a97?w=300&q=80', cat2: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&q=80' },
                        elegance: { hero: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80', cat1: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80', cat2: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&q=80' },
                        cozyhome: { hero: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1600&q=80', cat1: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&q=80', cat2: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&q=80' },
                        luxe: { hero: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1600&q=80', cat1: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=300&q=80', cat2: 'https://images.unsplash.com/photo-1535633302704-b02a41af7435?w=300&q=80' },
                        glow: { hero: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1600&q=80', cat1: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&q=80', cat2: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc0?w=300&q=80' },
                        activeplus: { hero: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=80', cat1: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80', cat2: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&q=80' },
                        freshcart: { hero: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=80', cat1: 'https://images.unsplash.com/photo-1518843875459-73f00172c441?w=300&q=80', cat2: 'https://images.unsplash.com/photo-1506484334402-40ff22e05a6d?w=300&q=80' },
                        kidswonder: { hero: 'https://images.unsplash.com/photo-1532330393533-443990a51d10?w=1600&q=80', cat1: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&q=80', cat2: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=300&q=80' },
                    };

                    const defaults = nicheDefaults[folderName] || {
                        hero: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
                        cat1: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=300&q=80',
                        cat2: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80'
                    };

                    const defaultHomeData = {
                        sections_order: ['header_1', 'hero_banner_1', 'category_slider_1', 'featured_grid_1', 'newsletter_1', 'footer_1'],
                        sections_data: {
                            'header_1': { type: 'header', settings: { notice_text: '🔥 شحن مجاني للطلبات فوق 200 ريال!', search_placeholder: 'ابحث عن منتج...' }, blocks: [{ type: 'link', settings: { label: 'الرئيسية', url: '/' } }, { type: 'link', settings: { label: 'كل المنتجات', url: '/products' } }] },
                            'hero_banner_1': { type: 'hero_banner', settings: { heading: 'اكتشف أحدث العروض الحصرية', subheading: 'تسوق الآن واحصل على خصم 20%', button_label: 'تسوق الآن', background_image: defaults.hero }, blocks: [] },
                            'category_slider_1': {
                                type: 'category_slider', settings: { heading: 'تسوق حسب التصنيف', subheading: 'تصفح مجموعاتنا' }, blocks: [
                                    { type: 'category', settings: { title: 'جديدنا', image_url: defaults.cat1, link: '' } },
                                    { type: 'category', settings: { title: 'الأكثر مبيعاً', image_url: defaults.cat2, link: '' } },
                                    { type: 'category', settings: { title: 'عروض خاصة', image_url: defaults.cat1, link: '' } },
                                    { type: 'category', settings: { title: 'تخفيضات', image_url: defaults.cat2, link: '' } }
                                ]
                            },
                            'featured_grid_1': {
                                type: 'featured_grid', settings: { heading: 'استمتع بأحدث التشكيلات', subheading: 'اخترنا لك بعناية' }, blocks: [
                                    { type: 'product', settings: { product_id: 'prod_1' } },
                                    { type: 'product', settings: { product_id: 'prod_2' } },
                                    { type: 'product', settings: { product_id: 'prod_3' } },
                                    { type: 'product', settings: { product_id: 'prod_4' } }
                                ]
                            },
                            'footer_1': { type: 'footer', settings: { about_heading: 'عن متجرنا', about_text: 'نقدم أفضل المنتجات.', copyright: 'جميع الحقوق محفوظة' }, blocks: [] },
                            'newsletter_1': { type: 'newsletter', settings: { heading: 'اشترك في نشرتنا البريدية', button_label: 'اشتراك' }, blocks: [] }
                        }
                    };

                    const defaultProductData = {
                        sections_order: ['main_product_1'],
                        sections_data: {
                            'main_product_1': {
                                type: 'main_product', settings: {}, blocks: [
                                    { type: 'title', id: 'block_title', settings: {} },
                                    { type: 'price', id: 'block_price', settings: {} },
                                    { type: 'visitors', id: 'block_visitors', settings: {} },
                                    { type: 'quantity', id: 'block_quantity', settings: {} },
                                    { type: 'offers', id: 'block_offers', settings: {} },
                                    { type: 'variants', id: 'block_variants', settings: {} },
                                    { type: 'buy_buttons', id: 'block_buy_buttons', settings: {} },
                                    { type: 'countdown', id: 'block_countdown', settings: {} },
                                    { type: 'shipping_info', id: 'block_shipping', settings: {} },
                                    { type: 'description', id: 'block_description', settings: {} }
                                ]
                            }
                        }
                    };

                    const defaultCheckoutData = {
                        sections_order: ['main_checkout_1'],
                        sections_data: {
                            'main_checkout_1': {
                                type: 'main_checkout', settings: {}, blocks: [
                                    { type: 'checkout_field', id: 'field_name', settings: { field_id: 'name', visible: true, required: true, placeholder: '' } },
                                    { type: 'checkout_field', id: 'field_phone', settings: { field_id: 'phone', visible: true, required: true, placeholder: '' } },
                                    { type: 'checkout_field', id: 'field_alt_phone', settings: { field_id: 'alt_phone', visible: false, required: false, placeholder: '' } },
                                    { type: 'checkout_field', id: 'field_email', settings: { field_id: 'email', visible: false, required: false, placeholder: '' } },
                                    { type: 'checkout_field', id: 'field_governorate', settings: { field_id: 'governorate', visible: false, required: false, placeholder: '' } },
                                    { type: 'checkout_field', id: 'field_city', settings: { field_id: 'city', visible: true, required: true, placeholder: '' } },
                                    { type: 'checkout_field', id: 'field_address', settings: { field_id: 'address', visible: true, required: true, placeholder: '' } },
                                    { type: 'checkout_field', id: 'field_notes', settings: { field_id: 'notes', visible: false, required: false, placeholder: '' } },
                                ]
                            }
                        }
                    };

                    await supabase.from('store_theme_templates').insert([
                        {
                            store_theme_id: newThemeRecord.id,
                            page_type: 'home',
                            settings_data: defaultHomeData
                        },
                        {
                            store_theme_id: newThemeRecord.id,
                            page_type: 'product',
                            settings_data: defaultProductData
                        },
                        {
                            store_theme_id: newThemeRecord.id,
                            page_type: 'checkout',
                            settings_data: defaultCheckoutData
                        }
                    ]);
                }
            }

            toast.success(language === 'ar' ? 'تم تفعيل الثيم بنجاح!' : 'Theme activated successfully!', { id: 'activate-theme' });
            await fetchThemesData();
        } catch (error: any) {
            console.error('Activation Error:', error);
            toast.error(error.message || (language === 'ar' ? 'فشل التفعيل' : 'Activation failed'), { id: 'activate-theme' });
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold">
                    {language === 'ar' ? 'المظهر والثيمات' : 'Themes & Appearance'}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {language === 'ar'
                        ? 'قم بإدارة تصميم متجرك وتخصيصه ليتناسب مع هويتك التجارية.'
                        : 'Manage your store design and customize it to match your brand identity.'}
                </p>
            </div>

            {/* Active Theme Section */}
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b bg-slate-50/50">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <MonitorPlay className="w-5 h-5 text-primary" />
                        {language === 'ar' ? 'الثيم الحالي النشط' : 'Current Active Theme'}
                    </h2>
                </div>

                {activeTheme ? (
                    <div className="p-6 flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-full md:w-1/3 aspect-video bg-slate-100 rounded-lg border flex items-center justify-center relative overflow-hidden group">
                            {activeTheme.theme_versions?.themes?.folder_name ? (
                                <img
                                    src={`/themes_thumbnails/${activeTheme.theme_versions.themes.folder_name}.png`}
                                    alt={activeTheme.theme_versions?.themes?.name || 'Theme'}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Palette className="w-12 h-12 text-slate-300" />
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button asChild variant="secondary">
                                    <Link href={`/s/${storeId}?preview=true`} target="_blank">
                                        {language === 'ar' ? 'معاينة المتجر' : 'Preview Store'}
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-2xl font-bold">
                                        {activeTheme.theme_versions?.themes?.name || 'Default Theme'}
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1 border border-green-200">
                                        <CheckCircle2 className="w-3 h-3" />
                                        {language === 'ar' ? 'نشط' : 'Active'}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {language === 'ar' ? 'الإصدار ' : 'Version '}
                                    {activeTheme.theme_versions?.version || '1.0.0'}
                                </p>
                            </div>

                            <p className="text-slate-600 max-w-lg">
                                {language === 'ar'
                                    ? 'هذا هو القالب المستخدم حالياً لعرض متجرك للعملاء. يمكنك تخصيص الألوان، رفع شعارك، وتغيير ترتيب الأقسام.'
                                    : 'This is the template currently used to display your store to customers. You can customize colors, upload your logo, and change section order.'}
                            </p>

                            <div className="pt-4 flex gap-3">
                                <Button size="lg" asChild className="px-8">
                                    <Link href={`/dashboard/${storeId}/editor`}>
                                        <Palette className="w-4 h-4 mr-2" />
                                        {language === 'ar' ? 'تخصيص الثيم' : 'Customize Theme'}
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <MonitorPlay className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">
                            {language === 'ar' ? 'لا يوجد ثيم مفعل' : 'No Active Theme'}
                        </h3>
                        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                            {language === 'ar'
                                ? 'الرجاء اختيار ثيم من مكتبة الثيمات بالأسفل وتفعيله للبدء في تخصيص متجرك.'
                                : 'Please select a theme from the library below and activate it to start customizing your store.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Theme Library Section */}
            <div className="pt-8">
                <h2 className="text-2xl font-bold mb-6">
                    {language === 'ar' ? 'مكتبة الثيمات' : 'Theme Library'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableThemes.map((theme) => {
                        const latestVersion = theme.theme_versions?.[theme.theme_versions.length - 1];
                        const isActive = activeTheme?.theme_versions?.themes?.id === theme.id;

                        if (!latestVersion) return null;

                        return (
                            <div key={theme.id} className={`bg-card rounded-xl border overflow-hidden flex flex-col ${isActive ? 'ring-2 ring-primary border-primary' : ''}`}>
                                <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center relative group p-4 border-b overflow-hidden">
                                    <img
                                        src={`/themes_thumbnails/${theme.folder_name}.png`}
                                        alt={theme.name}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                                            (e.currentTarget as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                    <MonitorPlay className="w-16 h-16 text-slate-300 relative z-0 hidden" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10">
                                        {!isActive && (
                                            <Button variant="default" onClick={() => activateTheme(latestVersion.id)}>
                                                {language === 'ar' ? 'تفعيل الثيم' : 'Activate Theme'}
                                            </Button>
                                        )}
                                    </div>
                                    {isActive && (
                                        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10">
                                            {language === 'ar' ? 'النشط حالياً' : 'Currently Active'}
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg">{theme.name}</h3>
                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono">
                                            v{latestVersion.version}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground flex-1 mb-6">
                                        {theme.folder_name === 'elegance' && 'ثيم مثالي لمتاجر الملابس والأزياء والموضة.'}
                                        {theme.folder_name === 'technova' && 'تصميم عصري وجذاب لمتاجر الإلكترونيات والهواتف الذكية.'}
                                        {theme.folder_name === 'cozyhome' && 'ديكورات وأثاث منزلي بلمسة دافئة ومريحة.'}
                                        {theme.folder_name === 'luxe' && 'المكان الأنسب لبيع المجوهرات، العطور، والماركات الفاخرة.'}
                                        {theme.folder_name === 'glow' && 'مستحضرات تجميل وعناية بالبشرة بتصميم يبرز الجمال.'}
                                        {theme.folder_name === 'activeplus' && 'معدات رياضية وملابس طاقة وحركة.'}
                                        {theme.folder_name === 'freshcart' && 'بقالة إلكترونية، فواكه، ومنتجات صحية ومأكولات.'}
                                        {theme.folder_name === 'kidswonder' && 'ألعاب، دمى، وكل ما يخطف قلب طفلك.'}
                                        {theme.folder_name === 'default' && (language === 'ar' ? 'ثيم احترافي بتصميم عصري يناسب جميع المتاجر الحديثة.' : 'Professional theme with a modern design suitable for all stores.')}
                                    </p>
                                    {!isActive ? (
                                        <Button variant="outline" className="w-full" onClick={() => activateTheme(latestVersion.id)}>
                                            {language === 'ar' ? 'إضافة لل متجر' : 'Add to Store'}
                                        </Button>
                                    ) : (
                                        <Button variant="secondary" className="w-full" disabled>
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            {language === 'ar' ? 'مفعل' : 'Activated'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
