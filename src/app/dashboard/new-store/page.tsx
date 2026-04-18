"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store, Loader2, ArrowRight, AlertCircle, Lock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from '@/hooks/use-toast';

export default function CreateStorePage() {
    const { language } = useLanguage();
    const router = useRouter();
    const supabase = createClient();

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [canCreateStore, setCanCreateStore] = useState(true);
    const [verifyingLimit, setVerifyingLimit] = useState(true);
    const [storesLimit, setStoresLimit] = useState<number | null>(null);

    useEffect(() => {
        const checkLimit = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { count: activeStoresCount } = await supabase
                    .from('stores')
                    .select('*', { count: 'exact', head: true })
                    .eq('owner_id', user.id)
                    .eq('status', 'active');

                const { data: planData } = await supabase.rpc('get_owner_effective_plan', { p_owner_id: user.id });

                let maxStores = 1;
                if (planData && planData.has_plan) {
                    maxStores = planData.plan.features?.stores_limit ?? 1;
                }
                setStoresLimit(maxStores);

                if (maxStores !== -1 && (activeStoresCount || 0) >= maxStores && (activeStoresCount || 0) > 0) {
                    setCanCreateStore(false);
                }
            } catch (err) {
                console.error("Limit check error", err);
            } finally {
                setVerifyingLimit(false);
            }
        };
        checkLimit();
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Basic Slug Validation (alphanumeric and hyphens)
            if (!/^[a-z0-9-]+$/.test(slug)) {
                throw new Error(language === 'ar' ? 'يجب أن يحتوي اسم الرابط على أحرف وأرقام وعلامات طرح فقط' : 'Slug must only contain lowercase letters, numbers, and hyphens');
            }

            // 2. Check Slug Availability
            const { data: existing } = await supabase
                .from('stores')
                .select('id')
                .eq('slug', slug)
                .maybeSingle();

            if (existing) {
                throw new Error(language === 'ar' ? 'هذا الرابط مستخدم بالفعل، يرجى اختيار رابط آخر' : 'This slug is already taken, please choose another');
            }

            // 3. Create Store via RPC
            const { data: storeId, error: rpcError } = await supabase.rpc('create_store', {
                p_name: name,
                p_slug: slug
            });

            if (rpcError) throw rpcError;

            // 4. Automatically Apply 'default' Theme
            try {
                // Fetch the default theme and its latest version
                const { data: themesData } = await supabase
                    .from('themes')
                    .select('id, folder_name, theme_versions(id)');

                if (themesData && themesData.length > 0) {
                    const defaultTheme = themesData.find((t: any) => t.folder_name === 'default') || themesData[0];
                    if (defaultTheme && defaultTheme.theme_versions && defaultTheme.theme_versions.length > 0) {
                    const latestVersionId = defaultTheme.theme_versions[defaultTheme.theme_versions.length - 1].id;

                    // Insert active store theme record
                    const { data: newStoreTheme, error: attachError } = await supabase
                        .from('store_themes')
                        .insert({
                            store_id: storeId,
                            theme_version_id: latestVersionId,
                            is_active: true
                        })
                        .select('id')
                        .single();

                    if (!attachError && newStoreTheme) {
                        // Seed default templates for the store to prevent crashing EditorPage
                        const defaultHomeData = {
                            sections_order: ['header_1', 'hero_banner_1', 'category_slider_1', 'featured_grid_1', 'newsletter_1', 'footer_1'],
                            sections_data: {
                                'header_1': { type: 'header', settings: { notice_text: '🔥 شحن مجاني للطلبات فوق 200 ريال!', search_placeholder: 'ابحث عن منتج...' }, blocks: [{ type: 'link', settings: { label: 'الرئيسية', url: '/' } }] },
                                'hero_banner_1': { type: 'hero_banner', settings: { heading: 'مرحباً بك في متجرك الجديد', subheading: 'قم بتخصيص هذا التصميم من لوحة التحكم', button_label: 'تسوق الآن', background_image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80' }, blocks: [] },
                                'category_slider_1': { type: 'category_slider', settings: { heading: 'تسوق حسب التصنيف', subheading: 'تصفح مجموعاتنا' }, blocks: [{ type: 'category', settings: { title: 'جديدنا', image_url: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=300&q=80', link: '' } }] },
                                'featured_grid_1': { type: 'featured_grid', settings: { heading: 'المنتجات المميزة', subheading: 'اخترنا لك بعناية' }, blocks: [] },
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
                                        { type: 'quantity', id: 'block_quantity', settings: {} },
                                        { type: 'buy_buttons', id: 'block_buy_buttons', settings: {} },
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
                                        { type: 'checkout_field', id: 'field_address', settings: { field_id: 'address', visible: true, required: true, placeholder: '' } },
                                    ]
                                }
                            }
                        };

                        await supabase.from('store_theme_templates').insert([
                            { store_theme_id: newStoreTheme.id, page_type: 'home', settings_data: defaultHomeData },
                            { store_theme_id: newStoreTheme.id, page_type: 'product', settings_data: defaultProductData },
                            { store_theme_id: newStoreTheme.id, page_type: 'checkout', settings_data: defaultCheckoutData }
                        ]);
                    }
                    }
                }
            } catch (themeErr) {
                console.error('Failed to automatically assign default theme:', themeErr);
                // We do not fail the store creation process if the theme binding fails.
            }

            toast({
                title: language === 'ar' ? 'تم إنشاء المتجر بنجاح' : 'Store Created Successfully',
                description: language === 'ar' ? 'يمكنك الآن البدء في إعداد متجرك الجديد' : 'You can now start setting up your new store.',
            });

            router.push(`/dashboard/${storeId}`);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[70vh] p-4">
            <Card className="w-full max-w-md shadow-lg border-0">
                <form onSubmit={handleSubmit}>
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Store className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            {language === 'ar' ? 'إنشاء متجر جديد' : 'Create New Store'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'ar'
                                ? 'أضف متجراً جديداً إلى حسابك وابدأ البيع فوراً'
                                : 'Add a new store to your account and start selling instantly'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        {error && (
                            <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>{language === 'ar' ? 'خطأ' : 'Error'}</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {!canCreateStore && !verifyingLimit && (
                            <Alert className="bg-yellow-50 border-yellow-200 mb-4">
                                <Lock className="h-4 w-4 text-yellow-600" />
                                <AlertTitle>{language === 'ar' ? 'تم الوصول للحد الأقصى' : 'Limit Reached'}</AlertTitle>
                                <AlertDescription>
                                    {language === 'ar'
                                        ? `لقد وصلت إلى الحد الأقصى المسموح به من المتاجر (${storesLimit}). يرجى ترقية باقتك لإنشاء المزيد المشترك.`
                                        : `You have reached the maximum allowed stores (${storesLimit}). Please upgrade your plan to create more.`}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">
                                {language === 'ar' ? 'اسم المتجر' : 'Store Name'}
                            </Label>
                            <Input
                                id="name"
                                placeholder={language === 'ar' ? 'مثال: أوردرلي للملابس' : 'e.g. My Clothing Store'}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">
                                {language === 'ar' ? 'رابط المتجر (Slug)' : 'Store Slug'}
                            </Label>
                            <div className="flex items-center group">
                                <Input
                                    id="slug"
                                    placeholder="my-store"
                                    className="rounded-e-none focus-visible:ring-0"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                                    required
                                    disabled={loading}
                                />
                                <div className="h-10 px-3 flex items-center bg-muted border border-s-0 rounded-e-md text-sm text-muted-foreground">
                                    .site.com
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground px-1">
                                {language === 'ar' ? 'أحرف إنجليزية صغيرة وأرقام وعلامة - فقط' : 'Lowercase, numbers, and hyphens only'}
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 pt-6">
                        <Button type="submit" className="w-full" disabled={loading || verifyingLimit || !canCreateStore}>
                            {loading || verifyingLimit ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    {language === 'ar' ? 'إنشاء المتجر' : 'Create Store'}
                                    <ArrowRight className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0" />
                                </>
                            )}
                        </Button>
                        <Button variant="ghost" className="w-full text-muted-foreground" asChild disabled={loading}>
                            <a href="/dashboard">
                                {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </a>
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
