"use client";

import { useState } from 'react';
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
                currency: 'SAR', // TODO: Get from store settings
                metadata: {
                    seo: {
                        title: formData.meta_title,
                        description: formData.meta_description,
                        keywords: formData.seo_keywords
                    }
                }
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
                        const optionPayloads = v.options.map((o: any, j: number) => ({
                            variant_id: insertedVariant.id,
                            label: o.label,
                            value: o.value || (o.label.ar || o.label.en),
                            price_modifier: o.price_modifier || 0,
                            is_default: o.is_default,
                            sort_order: j
                        }));

                        const { error: oError } = await supabase
                            .from('variant_options')
                            .insert(optionPayloads);

                        if (oError) throw oError;
                    }
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
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="ar">العربية</TabsTrigger>
                            <TabsTrigger value="en">English</TabsTrigger>
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
                    </Tabs>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="price">{language === 'ar' ? 'السعر (ر.س) *' : 'Price (SAR) *'}</Label>
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
