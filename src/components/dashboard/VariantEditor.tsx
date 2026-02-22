"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical, Palette, Type, Image, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface VariantOption {
    id?: string;
    label: { ar: string; en: string };
    value: string;
    price_modifier: number;
    is_default: boolean;
    sort_order: number;
}

interface Variant {
    id?: string;
    name: { ar: string; en: string };
    display_type: string;
    option_type: string;
    required: boolean;
    sort_order: number;
    options: VariantOption[];
    isExpanded?: boolean;
}

interface VariantEditorProps {
    productId: string;
}

export function VariantEditor({ productId }: VariantEditorProps) {
    const { language } = useLanguage();
    const supabase = createClient();
    const [variants, setVariants] = useState<Variant[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchVariants();
    }, [productId]);

    const fetchVariants = async () => {
        setLoading(true);
        const { data: variantData, error } = await supabase
            .from('product_variants')
            .select('*, variant_options(*)')
            .eq('product_id', productId)
            .order('sort_order');

        if (error) {
            console.error('Error fetching variants:', error);
            setLoading(false);
            return;
        }

        const mapped = (variantData || []).map((v: any) => ({
            id: v.id,
            name: typeof v.name === 'string' ? JSON.parse(v.name) : v.name,
            display_type: v.display_type,
            option_type: v.option_type,
            required: v.required,
            sort_order: v.sort_order,
            isExpanded: true,
            options: (v.variant_options || [])
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                .map((o: any) => ({
                    id: o.id,
                    label: typeof o.label === 'string' ? JSON.parse(o.label) : o.label,
                    value: o.value,
                    price_modifier: o.price_modifier || 0,
                    is_default: o.is_default,
                    sort_order: o.sort_order
                }))
        }));

        setVariants(mapped);
        setLoading(false);
    };

    const addVariant = () => {
        setVariants([...variants, {
            name: { ar: '', en: '' },
            display_type: 'buttons',
            option_type: 'text',
            required: false,
            sort_order: variants.length,
            isExpanded: true,
            options: []
        }]);
    };

    const removeVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const updateVariant = (index: number, field: string, value: any) => {
        setVariants(variants.map((v, i) => i === index ? { ...v, [field]: value } : v));
    };

    const addOption = (variantIndex: number) => {
        setVariants(variants.map((v, i) => {
            if (i !== variantIndex) return v;
            return {
                ...v,
                options: [...v.options, {
                    label: { ar: '', en: '' },
                    value: '',
                    price_modifier: 0,
                    is_default: v.options.length === 0,
                    sort_order: v.options.length
                }]
            };
        }));
    };

    const removeOption = (variantIndex: number, optionIndex: number) => {
        setVariants(variants.map((v, i) => {
            if (i !== variantIndex) return v;
            return { ...v, options: v.options.filter((_, j) => j !== optionIndex) };
        }));
    };

    const updateOption = (variantIndex: number, optionIndex: number, field: string, value: any) => {
        setVariants(variants.map((v, i) => {
            if (i !== variantIndex) return v;
            return {
                ...v,
                options: v.options.map((o, j) => j === optionIndex ? { ...o, [field]: value } : o)
            };
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Delete existing variants (cascade deletes options)
            await supabase.from('product_variants').delete().eq('product_id', productId);

            // Insert new variants
            for (let i = 0; i < variants.length; i++) {
                const v = variants[i];
                if (!v.name.ar && !v.name.en) continue;

                const { data: insertedVariant, error: vError } = await supabase
                    .from('product_variants')
                    .insert({
                        product_id: productId,
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
                if (v.options.length > 0) {
                    const optionPayloads = v.options.map((o, j) => ({
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

            toast.success(language === 'ar' ? 'تم حفظ المتغيرات بنجاح' : 'Variants saved successfully');
            fetchVariants();
        } catch (error: any) {
            console.error('Error saving variants:', error);
            toast.error(error.message || (language === 'ar' ? 'فشل حفظ المتغيرات' : 'Failed to save variants'));
        } finally {
            setSaving(false);
        }
    };

    const getOptionTypeIcon = (type: string) => {
        switch (type) {
            case 'color': return <Palette className="w-4 h-4" />;
            case 'image': return <Image className="w-4 h-4" />;
            default: return <Type className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    {language === 'ar' ? 'جاري تحميل المتغيرات...' : 'Loading variants...'}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                        {language === 'ar' ? 'الألوان والمقاسات (المتغيرات)' : 'Colors & Sizes (Variants)'}
                    </CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                        <Plus className="w-4 h-4 me-1" />
                        {language === 'ar' ? 'إضافة متغير' : 'Add Variant'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {variants.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p className="text-sm mb-2">
                            {language === 'ar' ? 'لا توجد متغيرات حالياً' : 'No variants yet'}
                        </p>
                        <p className="text-xs">
                            {language === 'ar'
                                ? 'أضف متغيرات مثل الألوان والمقاسات والأحجام'
                                : 'Add variants like colors, sizes, and dimensions'}
                        </p>
                    </div>
                )}

                {variants.map((variant, vIndex) => (
                    <div key={vIndex} className="border rounded-lg overflow-hidden">
                        {/* Variant Header */}
                        <div
                            className="flex items-center gap-2 p-3 bg-muted/50 cursor-pointer"
                            onClick={() => updateVariant(vIndex, 'isExpanded', !variant.isExpanded)}
                        >
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                            {getOptionTypeIcon(variant.option_type)}
                            <span className="font-medium flex-1 text-sm">
                                {variant.name.ar || variant.name.en || (language === 'ar' ? `متغير ${vIndex + 1}` : `Variant ${vIndex + 1}`)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {variant.options.length} {language === 'ar' ? 'خيار' : 'options'}
                            </span>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                                onClick={(e) => { e.stopPropagation(); removeVariant(vIndex); }}>
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                            {variant.isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>

                        {/* Variant Body */}
                        {variant.isExpanded && (
                            <div className="p-4 space-y-4">
                                {/* Variant Name */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">{language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                                        <Input
                                            value={variant.name.ar}
                                            onChange={(e) => updateVariant(vIndex, 'name', { ...variant.name, ar: e.target.value })}
                                            placeholder={language === 'ar' ? 'مثال: اللون' : 'e.g. Color'}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</Label>
                                        <Input
                                            value={variant.name.en}
                                            onChange={(e) => updateVariant(vIndex, 'name', { ...variant.name, en: e.target.value })}
                                            placeholder="e.g. Color"
                                            className="h-9"
                                        />
                                    </div>
                                </div>

                                {/* Variant Settings */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">{language === 'ar' ? 'نوع العرض' : 'Display Type'}</Label>
                                        <Select value={variant.display_type} onValueChange={(v) => updateVariant(vIndex, 'display_type', v)}>
                                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="buttons">{language === 'ar' ? 'أزرار' : 'Buttons'}</SelectItem>
                                                <SelectItem value="dropdown">{language === 'ar' ? 'قائمة منسدلة' : 'Dropdown'}</SelectItem>
                                                <SelectItem value="color">{language === 'ar' ? 'دوائر ألوان' : 'Color circles'}</SelectItem>
                                                <SelectItem value="image">{language === 'ar' ? 'صور' : 'Images'}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">{language === 'ar' ? 'نوع القيمة' : 'Value Type'}</Label>
                                        <Select value={variant.option_type} onValueChange={(v) => updateVariant(vIndex, 'option_type', v)}>
                                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">{language === 'ar' ? 'نص' : 'Text'}</SelectItem>
                                                <SelectItem value="color">{language === 'ar' ? 'لون' : 'Color'}</SelectItem>
                                                <SelectItem value="image">{language === 'ar' ? 'صورة' : 'Image'}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-end gap-2 pb-0.5">
                                        <Switch
                                            checked={variant.required}
                                            onCheckedChange={(v) => updateVariant(vIndex, 'required', v)}
                                        />
                                        <Label className="text-xs">{language === 'ar' ? 'مطلوب' : 'Required'}</Label>
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium">{language === 'ar' ? 'الخيارات' : 'Options'}</Label>
                                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => addOption(vIndex)}>
                                            <Plus className="w-3 h-3 me-1" />
                                            {language === 'ar' ? 'إضافة خيار' : 'Add Option'}
                                        </Button>
                                    </div>

                                    {variant.options.map((option, oIndex) => (
                                        <div key={oIndex} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                                            {variant.option_type === 'color' && (
                                                <input
                                                    type="color"
                                                    value={option.value || '#000000'}
                                                    onChange={(e) => updateOption(vIndex, oIndex, 'value', e.target.value)}
                                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                                />
                                            )}
                                            <Input
                                                value={option.label.ar}
                                                onChange={(e) => updateOption(vIndex, oIndex, 'label', { ...option.label, ar: e.target.value })}
                                                placeholder={language === 'ar' ? 'عربي' : 'Arabic'}
                                                className="h-8 text-xs flex-1"
                                            />
                                            <Input
                                                value={option.label.en}
                                                onChange={(e) => updateOption(vIndex, oIndex, 'label', { ...option.label, en: e.target.value })}
                                                placeholder="English"
                                                className="h-8 text-xs flex-1"
                                            />
                                            {variant.option_type !== 'color' && (
                                                <Input
                                                    value={option.value}
                                                    onChange={(e) => updateOption(vIndex, oIndex, 'value', e.target.value)}
                                                    placeholder={language === 'ar' ? 'القيمة' : 'Value'}
                                                    className="h-8 text-xs w-20"
                                                />
                                            )}
                                            <Input
                                                type="number"
                                                value={option.price_modifier || ''}
                                                onChange={(e) => updateOption(vIndex, oIndex, 'price_modifier', parseFloat(e.target.value) || 0)}
                                                placeholder="±0"
                                                className="h-8 text-xs w-16"
                                                title={language === 'ar' ? 'تعديل السعر' : 'Price modifier'}
                                            />
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                                                onClick={() => removeOption(vIndex, oIndex)}>
                                                <Trash2 className="w-3 h-3 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {variants.length > 0 && (
                    <Button type="button" onClick={handleSave} disabled={saving} className="w-full">
                        {saving
                            ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                            : (language === 'ar' ? 'حفظ المتغيرات' : 'Save Variants')}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
