import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Palette, Image as ImageIcon, Loader2, Upload, Type, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { DisplayType, OptionType } from '@/types/variant';
import { useToast } from '@/hooks/use-toast';

export interface VariantFormData {
  id?: string;
  nameAr: string;
  nameEn: string;
  displayType: DisplayType;
  optionType: OptionType;
  required: boolean;
  options: VariantOptionFormData[];
}

export interface VariantOptionFormData {
  id?: string;
  labelAr: string;
  labelEn: string;
  value: string;
  priceModifier: string;
  isDefault: boolean;
}

interface VariantManagerProps {
  variants: VariantFormData[];
  onChange: (variants: VariantFormData[]) => void;
  currency: string;
  storeId: string;
}

// Unified Type Selection for better UX
const VARIANT_TYPES: {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: any;
  optionType: OptionType;
  displayType: DisplayType;
}[] = [
    {
      id: 'text-buttons',
      labelAr: 'خيارات نصية (أزرار)',
      labelEn: 'Text Options (Buttons)',
      icon: Type,
      optionType: 'text',
      displayType: 'buttons'
    },
    {
      id: 'color-swatch',
      labelAr: 'ألوان (دوائر ملونة)',
      labelEn: 'Colors (Swatches)',
      icon: Palette,
      optionType: 'color',
      displayType: 'color'
    },
    {
      id: 'image-swatch',
      labelAr: 'صور (مصغرات)',
      labelEn: 'Images (Thumbnails)',
      icon: ImageIcon,
      optionType: 'image',
      displayType: 'image'
    },
    {
      id: 'text-dropdown',
      labelAr: 'قائمة منسدلة',
      labelEn: 'Dropdown List',
      icon: LayoutGrid,
      optionType: 'text',
      displayType: 'dropdown'
    },
  ];

export function VariantManager({ variants, onChange, currency, storeId }: VariantManagerProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});

  const addVariant = () => {
    onChange([
      ...variants,
      {
        nameAr: '',
        nameEn: '',
        displayType: 'buttons',
        optionType: 'text',
        required: true,
        options: [],
      },
    ]);
  };

  const updateVariant = (index: number, data: Partial<VariantFormData>) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], ...data };
    onChange(updated);
  };

  const handleTypeChange = (index: number, typeId: string) => {
    const selectedType = VARIANT_TYPES.find(t => t.id === typeId);
    if (selectedType) {
      updateVariant(index, {
        optionType: selectedType.optionType,
        displayType: selectedType.displayType
      });
    }
  };

  const getCurrentTypeId = (variant: VariantFormData) => {
    const match = VARIANT_TYPES.find(t =>
      t.optionType === variant.optionType && t.displayType === variant.displayType
    );
    // Fallback for custom combos or legacy data
    if (!match) {
      if (variant.optionType === 'color') return 'color-swatch';
      if (variant.optionType === 'image') return 'image-swatch';
      if (variant.displayType === 'dropdown') return 'text-dropdown';
      return 'text-buttons';
    }
    return match.id;
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const addOption = (variantIndex: number) => {
    const updated = [...variants];
    const optionType = updated[variantIndex].optionType;
    let defaultValue = '';
    if (optionType === 'color') defaultValue = '#000000';

    updated[variantIndex].options.push({
      labelAr: '',
      labelEn: '',
      value: defaultValue,
      priceModifier: '0',
      isDefault: updated[variantIndex].options.length === 0,
    });
    onChange(updated);
  };

  const updateOption = (
    variantIndex: number,
    optionIndex: number,
    data: Partial<VariantOptionFormData>
  ) => {
    const updated = [...variants];
    updated[variantIndex].options[optionIndex] = {
      ...updated[variantIndex].options[optionIndex],
      ...data,
    };

    if (data.isDefault) {
      updated[variantIndex].options = updated[variantIndex].options.map((opt, i) => ({
        ...opt,
        isDefault: i === optionIndex,
      }));
    }

    onChange(updated);
  };

  const removeOption = (variantIndex: number, optionIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].options = updated[variantIndex].options.filter(
      (_, i) => i !== optionIndex
    );
    onChange(updated);
  };

  const handleImageUpload = async (
    variantIndex: number,
    optionIndex: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يجب اختيار ملف صورة' : 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    const uploadKey = `${variantIndex}-${optionIndex}`;
    setUploadingState(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${storeId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      updateOption(variantIndex, optionIndex, { value: publicUrl });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploadingState(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const getCurrencyLabel = () => {
    const labels: Record<string, string> = {
      SAR: language === 'ar' ? 'ر.س' : 'SAR',
      USD: language === 'ar' ? 'دولار' : 'USD',
      EUR: language === 'ar' ? 'يورو' : 'EUR',
    };
    return labels[currency] || currency;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          {language === 'ar' ? 'متغيرات المنتج' : 'Product Variants'}
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={addVariant}>
          <Plus className="w-4 h-4 me-1" />
          {language === 'ar' ? 'إضافة متغير' : 'Add Variant'}
        </Button>
      </div>

      {variants.length === 0 ? (
        <Card className="p-8 border-dashed flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <LayoutGrid className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-medium text-lg mb-1">
            {language === 'ar' ? 'لا توجد متغيرات' : 'No Variants Added'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            {language === 'ar'
              ? 'أضف خيارات للمنتج مثل الألوان، المقاسات، أو خامات مختلفة.'
              : 'Add product options like colors, sizes, or materials.'}
          </p>
          <Button onClick={addVariant} size="sm">
            <Plus className="w-4 h-4 me-2" />
            {language === 'ar' ? 'إضافة أول متغير' : 'Add First Variant'}
          </Button>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {variants.map((variant, variantIndex) => (
            <AccordionItem
              key={variantIndex}
              value={`variant-${variantIndex}`}
              className="border rounded-lg bg-card"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 w-full">
                  <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col items-start gap-1 flex-1">
                    <span className="font-medium">
                      {language === 'ar'
                        ? variant.nameAr || `متغير جديد ${variantIndex + 1}`
                        : variant.nameEn || `New Variant ${variantIndex + 1}`}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                        {/* Show Icon based on type */}
                        {(() => {
                          const type = VARIANT_TYPES.find(t => t.id === getCurrentTypeId(variant));
                          const Icon = type?.icon || Type;
                          return <Icon className="w-3 h-3" />;
                        })()}
                        {(() => {
                          const type = VARIANT_TYPES.find(t => t.id === getCurrentTypeId(variant));
                          return language === 'ar' ? type?.labelAr : type?.labelEn;
                        })()}
                      </span>
                      <span>•</span>
                      <span>{variant.options.length} {language === 'ar' ? 'خيارات' : 'options'}</span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2 space-y-6">

                {/* 1. Configuration Section */}
                <div className="grid gap-6 p-4 bg-muted/30 rounded-lg border">
                  {/* Names */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                        {language === 'ar' ? 'اسم المتغير (عربي)' : 'Name (Arabic)'}
                      </Label>
                      <Input
                        value={variant.nameAr}
                        onChange={(e) => updateVariant(variantIndex, { nameAr: e.target.value })}
                        placeholder={language === 'ar' ? 'مثال: اللون' : 'e.g., Color'}
                        dir="rtl"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                        {language === 'ar' ? 'اسم المتغير (إنجليزي)' : 'Name (English)'}
                      </Label>
                      <Input
                        value={variant.nameEn}
                        onChange={(e) => updateVariant(variantIndex, { nameEn: e.target.value })}
                        placeholder={language === 'ar' ? 'مثال: Color' : 'e.g., Color'}
                        dir="ltr"
                        className="bg-background"
                      />
                    </div>
                  </div>

                  {/* Type Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      {language === 'ar' ? 'نوع المتغير' : 'Variant Type'}
                    </Label>
                    <Select
                      value={getCurrentTypeId(variant)}
                      onValueChange={(value) => handleTypeChange(variantIndex, value)}
                    >
                      <SelectTrigger className="bg-background h-10 w-full sm:w-[350px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VARIANT_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2">
                              <type.icon className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {language === 'ar' ? type.labelAr : type.labelEn}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 2. Options Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      {language === 'ar' ? 'خيارات المتغير' : 'Variant Options'}
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(variantIndex)}
                      className="h-8"
                    >
                      <Plus className="w-3 h-3 me-1" />
                      {language === 'ar' ? 'إضافة خيار' : 'Add Option'}
                    </Button>
                  </div>

                  {variant.options.length === 0 && (
                    <div className="text-center py-8 border rounded-lg border-dashed text-muted-foreground text-sm">
                      {language === 'ar' ? 'لا توجد خيارات مضافة' : 'No options added yet'}
                    </div>
                  )}

                  <div className="grid gap-3">
                    {variant.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex gap-3 items-start p-3 bg-card border rounded-lg hover:border-primary/50 transition-colors group">
                        {/* Grip Handle (Visual) */}
                        <div className="mt-3 cursor-move text-muted-foreground/30 hover:text-muted-foreground">
                          <GripVertical className="w-4 h-4" />
                        </div>

                        <div className="flex-1 grid gap-3">
                          {/* Top Row: Labels */}
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              value={option.labelAr}
                              onChange={(e) => updateOption(variantIndex, optionIndex, { labelAr: e.target.value })}
                              placeholder={language === 'ar' ? 'الاسم (عربي)' : 'Name (AR)'}
                              className="h-9"
                              dir="rtl"
                            />
                            <Input
                              value={option.labelEn}
                              onChange={(e) => updateOption(variantIndex, optionIndex, { labelEn: e.target.value })}
                              placeholder={language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (EN)'}
                              className="h-9"
                              dir="ltr"
                            />
                          </div>

                          {/* Bottom Row: Value & Price */}
                          <div className="flex flex-wrap gap-3 items-center">
                            {/* Color Picker */}
                            {variant.optionType === 'color' && (
                              <div className="flex items-center gap-2 bg-muted p-1 rounded-md border">
                                <div className="relative w-6 h-6 flex-shrink-0">
                                  <div
                                    className="w-6 h-6 rounded-full border shadow-sm"
                                    style={{ backgroundColor: option.value }}
                                  />
                                  <input
                                    type="color"
                                    value={option.value}
                                    onChange={(e) => updateOption(variantIndex, optionIndex, { value: e.target.value })}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                                  />
                                </div>
                                <Input
                                  type="text"
                                  value={option.value}
                                  onChange={(e) => updateOption(variantIndex, optionIndex, { value: e.target.value })}
                                  className="w-20 h-7 text-xs font-mono border-0 bg-transparent focus-visible:ring-0 p-0"
                                  placeholder="#000000"
                                />
                              </div>
                            )}

                            {/* Image Uploader */}
                            {variant.optionType === 'image' && (
                              <div className="flex items-center gap-2">
                                {option.value ? (
                                  <div className="relative w-9 h-9 rounded border overflow-hidden group/img">
                                    <img src={option.value} className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => updateOption(variantIndex, optionIndex, { value: '' })}
                                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="w-3 h-3 text-white" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="w-9 h-9 rounded border border-dashed flex items-center justify-center bg-muted">
                                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                )}

                                <div className="relative">
                                  <Input
                                    id={`up-${variantIndex}-${optionIndex}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(variantIndex, optionIndex, e)}
                                    disabled={uploadingState[`${variantIndex}-${optionIndex}`]}
                                  />
                                  <Label
                                    htmlFor={`up-${variantIndex}-${optionIndex}`}
                                    className={cn(
                                      "h-9 px-3 flex items-center gap-2 border rounded-md cursor-pointer hover:bg-accent text-sm",
                                      uploadingState[`${variantIndex}-${optionIndex}`] && "opacity-50 cursor-not-allowed"
                                    )}
                                  >
                                    {uploadingState[`${variantIndex}-${optionIndex}`] ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Upload className="w-3 h-3" />
                                    )}
                                    {language === 'ar' ? 'رفع' : 'Upload'}
                                  </Label>
                                </div>
                              </div>
                            )}

                            {/* Text Value (if default/text) */}
                            {variant.optionType === 'text' && (
                              <div className="w-32 hidden">
                                {/* Only show if we strictly need mapped values, but for text ID/Name is enough usually unless we add SKU mapping later */}
                              </div>
                            )}

                            {/* Price Modifier */}
                            <div className="flex items-center gap-2 ms-auto">
                              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                {language === 'ar' ? 'السعر الإضافي' : 'Extra Price'}
                              </Label>
                              <Input
                                type="number"
                                className="h-8 w-24 text-sm"
                                value={option.priceModifier}
                                onChange={(e) => updateOption(variantIndex, optionIndex, { priceModifier: e.target.value })}
                                placeholder="0"
                              />
                            </div>

                            {/* Actions */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeOption(variantIndex, optionIndex)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`req-${variantIndex}`}
                      checked={variant.required}
                      onCheckedChange={(c) => updateVariant(variantIndex, { required: c })}
                    />
                    <Label htmlFor={`req-${variantIndex}`} className="text-sm">
                      {language === 'ar' ? 'حقل إجباري' : 'Required Field'}
                    </Label>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => removeVariant(variantIndex)}
                  >
                    {language === 'ar' ? 'حذف المتغير بالكامل' : 'Delete Variant'}
                  </Button>
                </div>

              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

// Add separator component just in case imports miss it
function Separator() {
  return <div className="h-px bg-border w-full my-2" />;
}
