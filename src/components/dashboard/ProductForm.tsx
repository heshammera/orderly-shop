"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIProductGenerator } from '@/components/dashboard/AIProductGenerator';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { AISeoGenerator } from '@/components/dashboard/AISeoGenerator';
import { AITranslator } from '@/components/dashboard/AITranslator';
import { Sparkles, Languages, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ImageUpload } from '@/components/dashboard/ImageUpload';
import { VariantEditor } from '@/components/dashboard/VariantEditor';
import { UpsellManager, UpsellFormData } from '@/components/dashboard/UpsellManager';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Settings2, Zap, Truck, Timer, Users } from 'lucide-react';

interface ProductFormProps {
    storeId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    initialData?: any;
}

export function ProductForm({ storeId, onSuccess, onCancel, initialData }: ProductFormProps) {
    const router = useRouter();
    const supabase = createClient();
    const { language } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [variants, setVariants] = useState<any[]>([]);
    const [upsellOffers, setUpsellOffers] = useState<UpsellFormData[]>([]);
    const [storeCurrency, setStoreCurrency] = useState('SAR');
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Load initial Upsells
    useEffect(() => {
        if (initialData?.id) {
            const fetchUpsells = async () => {
                const { data } = await supabase
                    .from('upsell_offers')
                    .select('*')
                    .eq('product_id', initialData.id)
                    .order('sort_order');
                if (data) {
                    setUpsellOffers(data.map((o: any) => ({
                        id: o.id,
                        minQuantity: o.min_quantity.toString(),
                        discountType: o.discount_type,
                        discountValue: o.discount_value.toString(),
                        labelAr: typeof o.label === 'string' ? JSON.parse(o.label).ar : o.label?.ar || '',
                        labelEn: typeof o.label === 'string' ? JSON.parse(o.label).en : o.label?.en || '',
                        badgeAr: typeof o.badge === 'string' ? JSON.parse(o.badge).ar : o.badge?.ar || '',
                        badgeEn: typeof o.badge === 'string' ? JSON.parse(o.badge).en : o.badge?.en || '',
                        isActive: o.is_active,
                    })));
                }
            };
            fetchUpsells();

            const fetchProductCategories = async () => {
                const { data } = await supabase
                    .from('product_categories')
                    .select('category_id')
                    .eq('product_id', initialData.id);
                if (data) {
                    setSelectedCategories(data.map((pc: any) => pc.category_id));
                }
            };
            fetchProductCategories();
        }

        // Fetch store currency
        const fetchStoreCurrency = async () => {
            if (!storeId) return;
            const { data } = await supabase.from('stores').select('currency').eq('id', storeId).single();
            if (data?.currency) {
                setStoreCurrency(data.currency);
            }
        };
        fetchStoreCurrency();

        const fetchAvailableCategories = async () => {
            if (!storeId) return;
            const { data } = await supabase
                .from('categories')
                .select('*')
                .eq('store_id', storeId)
                .order('sort_order');
            if (data) {
                setCategories(data);
            }
        };
        fetchAvailableCategories();
    }, [initialData?.id, storeId]);

    // Helper to parse JSON fields safely
    const parseField = (field: any, key: string) => {
        try {
            return typeof field === 'string' ? JSON.parse(field)[key] || '' : field?.[key] || '';
        } catch {
            return '';
        }
    };

    const [formData, setFormData] = useState({
        name_ar: initialData ? parseField(initialData.name, 'ar') : '',
        name_en: initialData ? parseField(initialData.name, 'en') : '',
        description_ar: initialData ? parseField(initialData.description, 'ar') : '',
        description_en: initialData ? parseField(initialData.description, 'en') : '',
        price: initialData?.price?.toString() || '',
        stock_quantity: initialData?.stock_quantity?.toString() || '',
        sku: initialData?.sku || '',
        images: initialData ? (
            typeof initialData.images === 'string'
                ? (initialData.images.startsWith('[')
                    ? JSON.parse(initialData.images)
                    : [initialData.images].filter(Boolean))
                : (Array.isArray(initialData.images) ? initialData.images : [])
        ) : [],
        seo_keywords: initialData?.metadata?.seo?.keywords || '',
        meta_title: initialData?.metadata?.seo?.title || '',
        meta_description: initialData?.metadata?.seo?.description || '',
        skip_cart: initialData?.skip_cart || false,
        free_shipping: initialData?.free_shipping || false,
        fake_countdown_enabled: initialData?.fake_countdown_enabled || false,
        fake_countdown_minutes: initialData?.fake_countdown_minutes || 60,
        fake_visitors_enabled: initialData?.fake_visitors_enabled || false,
        fake_visitors_min: initialData?.fake_visitors_min || 10,
        fake_visitors_max: initialData?.fake_visitors_max || 50,
        ignore_stock: initialData?.ignore_stock || false,
        sale_price: initialData?.sale_price?.toString() || '',
    });

    const handleAIGenerated = (data: any) => {
        setFormData((prev) => ({
            ...prev,
            name_ar: data.title_ar || prev.name_ar,
            name_en: data.title_en || prev.name_en,
            description_ar: data.description_ar || prev.description_ar,
            description_en: data.description_en || prev.description_en,
            seo_keywords: data.seo_keywords?.join(', ') || prev.seo_keywords,
        }));
    };

    const handleSeoGenerated = (data: any) => {
        setFormData((prev) => ({
            ...prev,
            meta_title: data.metaTitle,
            meta_description: data.metaDescription,
            seo_keywords: data.tags?.join(', ') || prev.seo_keywords,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                store_id: storeId,
                name: JSON.stringify({ ar: formData.name_ar, en: formData.name_en }),
                description: JSON.stringify({ ar: formData.description_ar, en: formData.description_en }),
                price: parseFloat(formData.price),
                stock_quantity: parseInt(formData.stock_quantity),
                sku: formData.sku,
                images: formData.images && formData.images.length > 0 ? JSON.stringify(formData.images) : null,
                status: 'active',
                skip_cart: formData.skip_cart,
                free_shipping: formData.free_shipping,
                fake_countdown_enabled: formData.fake_countdown_enabled,
                fake_countdown_minutes: parseInt(formData.fake_countdown_minutes.toString()),
                fake_visitors_enabled: formData.fake_visitors_enabled,
                fake_visitors_min: parseInt(formData.fake_visitors_min.toString()),
                fake_visitors_max: parseInt(formData.fake_visitors_max.toString()),
                ignore_stock: formData.ignore_stock,
                sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
            };

            let savedProductId = initialData?.id;

            if (initialData) {
                const { error: updateError } = await supabase
                    .from('products')
                    .update(payload)
                    .eq('id', initialData.id);
                if (updateError) throw updateError;
            } else {
                const { data, error: insertError } = await supabase
                    .from('products')
                    .insert(payload)
                    .select()
                    .single();
                if (insertError) throw insertError;
                savedProductId = data.id;
            }

            // Save Variants
            if (savedProductId && (variants.length > 0 || initialData)) {
                // Delete existing variants (cascade deletes options)
                await supabase.from('product_variants').delete().eq('product_id', savedProductId);

                // Insert new variants
                for (let i = 0; i < variants.length; i++) {
                    const v = variants[i];
                    if (!v.name.ar && !v.name.en) continue;

                    const { data: insertedVariant, error: vError } = await supabase
                        .from('product_variants')
                        .insert({
                            product_id: savedProductId,
                            name: v.name,
                            display_type: v.display_type,
                            option_type: v.option_type,
                            required: v.required,
                            sort_order: i
                        })
                        .select()
                        .single();

                    if (vError) throw vError;

                    // Insert options
                    if (v.options && v.options.length > 0) {
                        const optionPayloads = v.options.map((o: any, j: number) => {
                            const basePrice = (formData.sale_price && parseFloat(formData.sale_price) > 0)
                                ? parseFloat(formData.sale_price)
                                : parseFloat(formData.price);

                            return {
                                variant_id: insertedVariant.id,
                                label: o.label,
                                value: o.value || (o.label.ar || o.label.en),
                                price: o.price !== undefined ? parseFloat(o.price.toString()) : basePrice,
                                stock: parseInt(o.stock?.toString() || '0'),
                                manage_stock: o.manage_stock !== false,
                                is_default: o.is_default,
                                sort_order: j,
                                in_stock: o.in_stock !== false
                            };
                        });

                        const { error: oError } = await supabase
                            .from('variant_options')
                            .insert(optionPayloads);

                        if (oError) throw oError;
                    }
                }
            }

            // Save Categories
            if (savedProductId) {
                // Delete existing category relations
                if (initialData) {
                    await supabase.from('product_categories').delete().eq('product_id', savedProductId);
                }

                if (selectedCategories.length > 0) {
                    const categoryPayloads = selectedCategories.map(categoryId => ({
                        product_id: savedProductId,
                        category_id: categoryId
                    }));

                    const { error: catError } = await supabase
                        .from('product_categories')
                        .insert(categoryPayloads);

                    if (catError) throw catError;
                }
            }

            // Save Categories
            if (savedProductId) {
                // Delete existing category relations
                if (initialData) {
                    await supabase.from('product_categories').delete().eq('product_id', savedProductId);
                }

                if (selectedCategories.length > 0) {
                    const categoryPayloads = selectedCategories.map(categoryId => ({
                        product_id: savedProductId,
                        category_id: categoryId
                    }));

                    const { error: catError } = await supabase
                        .from('product_categories')
                        .insert(categoryPayloads);

                    if (catError) throw catError;
                }
            }

            // Save Upsells
            if (savedProductId && (upsellOffers.length > 0 || initialData)) {
                await supabase.from('upsell_offers').delete().eq('product_id', savedProductId);

                if (upsellOffers.length > 0) {
                    const offersToInsert = upsellOffers.map((o, i) => ({
                        product_id: savedProductId,
                        min_quantity: parseInt(o.minQuantity) || 2,
                        discount_type: o.discountType,
                        discount_value: parseFloat(o.discountValue) || 0,
                        label: { ar: o.labelAr, en: o.labelEn },
                        badge: { ar: o.badgeAr, en: o.badgeEn },
                        is_active: o.isActive,
                        sort_order: i,
                    }));

                    const { error } = await supabase
                        .from('upsell_offers')
                        .insert(offersToInsert);

                    if (error) throw error;
                }
            }

            toast.success(initialData ? (language === 'ar' ? 'تم تحديث المنتج بنجاح! 🎉' : 'Product updated successfully! 🎉') : (language === 'ar' ? 'تم إنشاء المنتج بنجاح! 🎉' : 'Product created successfully! 🎉'));
            if (onSuccess) onSuccess();
            else router.push(`/dashboard/${storeId}/products`);
        } catch (error: any) {
            console.error('Error saving product:', error);
            toast.error(error.message || (language === 'ar' ? 'فشل حفظ المنتج' : 'Failed to save product'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{language === 'ar' ? 'معلومات المنتج' : 'Product Information'}</CardTitle>
                            <CardDescription>{language === 'ar' ? 'أضف تفاصيل المنتج بالعربية والإنجليزية' : 'Add product details in Arabic and English'}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <AIProductGenerator onGenerated={handleAIGenerated} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Tabs defaultValue={language === 'ar' ? "ar" : "en"} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="ar">العربية</TabsTrigger>
                            <TabsTrigger value="en">English</TabsTrigger>
                            <TabsTrigger value="advanced" className="flex items-center gap-2">
                                <Settings2 className="w-4 h-4" />
                                {language === 'ar' ? 'إعدادات متقدمة' : 'Advanced'}
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="ar" className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="name_ar">{language === 'ar' ? 'اسم المنتج (بالعربية) *' : 'Product Name (Arabic) *'}</Label>
                                    <AITranslator
                                        initialText={formData.name_en}
                                        onTranslated={(text) => setFormData(prev => ({ ...prev, name_ar: text }))}
                                    />
                                </div>
                                <Input
                                    id="name_ar"
                                    required
                                    value={formData.name_ar}
                                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                                    placeholder={language === 'ar' ? 'اسم المنتج بالعربية' : 'Product Name in Arabic'}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="description_ar">{language === 'ar' ? 'الوصف (بالعربية) *' : 'Description (Arabic) *'}</Label>
                                    <AITranslator
                                        initialText={formData.description_en}
                                        onTranslated={(text) => setFormData(prev => ({ ...prev, description_ar: text }))}
                                    />
                                </div>
                                <Textarea
                                    id="description_ar"
                                    required
                                    value={formData.description_ar}
                                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                                    placeholder={language === 'ar' ? 'وصف المنتج التفصيلي بالعربية' : 'Detailed product description in Arabic'}
                                    rows={6}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="en" className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="name_en">{language === 'ar' ? 'اسم المنتج (بالإنجليزية) *' : 'Product Name (English) *'}</Label>
                                    <AITranslator
                                        initialText={formData.name_ar}
                                        onTranslated={(text) => setFormData(prev => ({ ...prev, name_en: text }))}
                                    />
                                </div>
                                <Input
                                    id="name_en"
                                    required
                                    value={formData.name_en}
                                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                                    placeholder={language === 'ar' ? 'اسم المنتج بالإنجليزية' : 'Product name in English'}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="description_en">{language === 'ar' ? 'الوصف (بالإنجليزية) *' : 'Description (English) *'}</Label>
                                    <AITranslator
                                        initialText={formData.description_ar}
                                        onTranslated={(text) => setFormData(prev => ({ ...prev, description_en: text }))}
                                    />
                                </div>
                                <Textarea
                                    id="description_en"
                                    required
                                    value={formData.description_en}
                                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                                    placeholder={language === 'ar' ? 'وصف المنتج التفصيلي بالإنجليزية' : 'Detailed product description in English'}
                                    rows={6}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="advanced" className="space-y-6 pt-4">
                            <div className="grid gap-6 md:grid-cols-2">
                                <Card className="border-primary/20">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-primary" />
                                            <CardTitle className="text-sm font-bold">{language === 'ar' ? 'تحسين التحويل' : 'Conversion Optimization'}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent/50 transition-colors">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm cursor-pointer" htmlFor="skip_cart">{language === 'ar' ? 'تخطي السلة' : 'Skip Cart'}</Label>
                                                <p className="text-[10px] text-muted-foreground">{language === 'ar' ? 'التوجه مباشرة لصفحة الدفع عند الشراء' : 'Go directly to checkout'}</p>
                                            </div>
                                            <Switch
                                                id="skip_cart"
                                                checked={formData.skip_cart}
                                                onCheckedChange={(v) => setFormData({ ...formData, skip_cart: v })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent/50 transition-colors">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm cursor-pointer" htmlFor="free_shipping">{language === 'ar' ? 'تفعيل الشحن المجاني' : 'Free Shipping'}</Label>
                                                <p className="text-[10px] text-muted-foreground">{language === 'ar' ? 'إظهار شارة شحن مجاني للمنتج' : 'Show free shipping badge'}</p>
                                            </div>
                                            <Switch
                                                id="free_shipping"
                                                checked={formData.free_shipping}
                                                onCheckedChange={(v) => setFormData({ ...formData, free_shipping: v })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent/50 transition-colors bg-primary/5">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm cursor-pointer font-bold" htmlFor="ignore_stock">{language === 'ar' ? 'تخطي المخزون للمنتج' : 'Ignore Product Stock'}</Label>
                                                <p className="text-[10px] text-muted-foreground">{language === 'ar' ? 'السماح بالطلب حتى لو نفذ المخزون للمنتج وجميع متغيراته' : 'Allow orders even if stock is 0 for product and variants'}</p>
                                            </div>
                                            <Switch
                                                id="ignore_stock"
                                                checked={formData.ignore_stock}
                                                onCheckedChange={(v) => setFormData({ ...formData, ignore_stock: v })}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-primary/20">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-2">
                                            <Timer className="w-4 h-4 text-primary" />
                                            <CardTitle className="text-sm font-bold">{language === 'ar' ? 'عداد الوقت الوهمي' : 'Fake Countdown'}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm">{language === 'ar' ? 'تفعيل العداد' : 'Enable Countdown'}</Label>
                                            <Switch
                                                checked={formData.fake_countdown_enabled}
                                                onCheckedChange={(v) => setFormData({ ...formData, fake_countdown_enabled: v })}
                                            />
                                        </div>
                                        {formData.fake_countdown_enabled && (
                                            <div className="space-y-2 pt-2 border-t">
                                                <Label className="text-xs">{language === 'ar' ? 'المدة (بالدقائق)' : 'Duration (Minutes)'}</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.fake_countdown_minutes}
                                                    onChange={(e) => setFormData({ ...formData, fake_countdown_minutes: parseInt(e.target.value) || 0 })}
                                                    placeholder="60"
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="border-primary/20 md:col-span-2">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-primary" />
                                            <CardTitle className="text-sm font-bold">{language === 'ar' ? 'عداد الزوار الوهمي' : 'Fake Visitors'}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm">{language === 'ar' ? 'تفعيل عداد الزوار' : 'Enable Visitors Counter'}</Label>
                                            <Switch
                                                checked={formData.fake_visitors_enabled}
                                                onCheckedChange={(v) => setFormData({ ...formData, fake_visitors_enabled: v })}
                                            />
                                        </div>
                                        {formData.fake_visitors_enabled && (
                                            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">{language === 'ar' ? 'من' : 'From'}</Label>
                                                    <Input
                                                        type="number"
                                                        value={formData.fake_visitors_min}
                                                        onChange={(e) => setFormData({ ...formData, fake_visitors_min: parseInt(e.target.value) || 0 })}
                                                        placeholder="10"
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">{language === 'ar' ? 'إلى' : 'To'}</Label>
                                                    <Input
                                                        type="number"
                                                        value={formData.fake_visitors_max}
                                                        onChange={(e) => setFormData({ ...formData, fake_visitors_max: parseInt(e.target.value) || 0 })}
                                                        placeholder="50"
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="price">{language === 'ar' ? `السعر (${storeCurrency}) *` : `Price (${storeCurrency}) *`}</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                required
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="99.99"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sale_price">{language === 'ar' ? 'السعر بعد الخصم (اختياري)' : 'Sale Price (Optional)'}</Label>
                            <Input
                                id="sale_price"
                                type="number"
                                step="0.01"
                                value={formData.sale_price}
                                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                                placeholder="79.99"
                                className="border-emerald-200 dark:border-emerald-900 focus-visible:ring-emerald-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stock_quantity">{language === 'ar' ? 'كمية المخزون *' : 'Stock Quantity *'}</Label>
                            <Input
                                id="stock_quantity"
                                type="number"
                                required
                                value={formData.stock_quantity}
                                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                                placeholder="100"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sku">{language === 'ar' ? 'رمز التخزين التعريفي (اختياري)' : 'SKU (Optional)'}</Label>
                        <Input
                            id="sku"
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            placeholder="PROD-001"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>{language === 'ar' ? 'صور المنتج' : 'Product Images'}</Label>
                        <ImageUpload
                            value={formData.images as string[]}
                            onChange={(urls) => setFormData({ ...formData, images: urls as any })}
                            onRemove={(url) => setFormData({ ...formData, images: (formData.images as string[]).filter((current) => current !== url) as any })}
                        />
                    </div>

                    <div className="space-y-4">
                        <Label>{language === 'ar' ? 'التصنيفات' : 'Categories'}</Label>
                        <Card className="p-4">
                            {categories.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {language === 'ar' ? 'لا توجد تصنيفات متاحة. يرجى إضافة تصنيفات من صفحة التصنيفات أولاً.' : 'No categories available. Please add categories from the Categories page first.'}
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {categories.map((category) => {
                                        const name = typeof category.name === 'string' ? JSON.parse(category.name) : category.name;
                                        const categoryName = name?.[language] || name?.ar || name?.en || 'Unnamed Category';
                                        const isChecked = selectedCategories.includes(category.id);

                                        return (
                                            <div key={category.id} className="flex items-center space-x-2 space-x-reverse h-8">
                                                <Checkbox
                                                    id={`category-${category.id}`}
                                                    checked={isChecked}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedCategories([...selectedCategories, category.id]);
                                                        } else {
                                                            setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                                                        }
                                                    }}
                                                />
                                                <Label
                                                    htmlFor={`category-${category.id}`}
                                                    className="text-sm font-medium leading-none cursor-pointer"
                                                >
                                                    {categoryName}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium">{language === 'ar' ? 'إعدادات تحسين محركات البحث (SEO)' : 'SEO Settings'}</h3>
                            <AISeoGenerator
                                onGenerated={handleSeoGenerated}
                                initialProductName={formData.name_en || formData.name_ar}
                                initialDescription={formData.description_en || formData.description_ar}
                            />
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="meta_title">{language === 'ar' ? 'عنوان الميتا (Meta Title)' : 'Meta Title'}</Label>
                                <Input
                                    id="meta_title"
                                    value={formData.meta_title}
                                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                                    placeholder="SEO Title"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="meta_description">{language === 'ar' ? 'وصف الميتا (Meta Description)' : 'Meta Description'}</Label>
                                <Textarea
                                    id="meta_description"
                                    value={formData.meta_description}
                                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                                    placeholder="SEO Description"
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="seo_keywords">{language === 'ar' ? 'الكلمات المفتاحية (SEO Keywords)' : 'SEO Keywords'}</Label>
                                <Input
                                    id="seo_keywords"
                                    value={formData.seo_keywords}
                                    onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                                    placeholder="keyword1, keyword2, keyword3"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <VariantEditor
                            productId={initialData?.id}
                            value={variants}
                            onChange={setVariants}
                            standalone={false}
                            storeId={storeId}
                            basePrice={formData.price}
                            baseStock={formData.stock_quantity}
                            globalIgnoreStock={formData.ignore_stock}
                        />
                    </div>

                    <div className="border-t pb-6">
                        <UpsellManager
                            offers={upsellOffers}
                            onChange={setUpsellOffers}
                            currency={storeCurrency}
                            basePrice={parseFloat(formData.price) || 0}
                        />
                    </div>

                </CardContent>
            </Card>

            <div className="flex items-center gap-4">
                <Button type="submit" disabled={loading} size="lg">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" />
                    {initialData ? (language === 'ar' ? 'تحديث المنتج' : 'Update Product') : (language === 'ar' ? 'إنشاء المنتج' : 'Create Product')}
                </Button>
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                )}
            </div>
        </form>
    );
}
