import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Product, parseProduct } from '@/types/product';
import { parseVariant, parseVariantOption, parseUpsellOffer } from '@/types/variant';
import type { VariantFormData, VariantOptionFormData } from './VariantManager';
import type { UpsellFormData } from './UpsellManager';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { ProductImageUpload } from './ProductImageUpload';
import { VariantManager } from './VariantManager';
import { UpsellManager } from './UpsellManager';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  storeId: string;
  currency: string;
  onSave: (product: Product, isNew: boolean) => void;
}

interface ProductFormData {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: string;
  trackInventory: boolean;
  status: string;
  sku: string;
  barcode: string;
  images: string[];
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  storeId,
  currency,
  onSave,
}: ProductDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState<ProductFormData>({
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    price: '',
    compareAtPrice: '',
    stockQuantity: '0',
    trackInventory: true,
    status: 'draft',
    sku: '',
    barcode: '',
    images: [],
  });

  const [variants, setVariants] = useState<VariantFormData[]>([]);
  const [upsellOffers, setUpsellOffers] = useState<UpsellFormData[]>([]);

  useEffect(() => {
    if (open) {
      setActiveTab('basic');
      if (product) {
        loadProductData();
      } else {
        resetForm();
      }
    }
  }, [product, open]);

  const resetForm = () => {
    setFormData({
      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      descriptionEn: '',
      price: '',
      compareAtPrice: '',
      stockQuantity: '0',
      trackInventory: true,
      status: 'draft',
      sku: '',
      barcode: '',
      images: [],
    });
    setVariants([]);
    setUpsellOffers([]);
  };

  const loadProductData = async () => {
    if (!product) return;

    setLoading(true);

    // Set basic form data
    setFormData({
      nameAr: product.name.ar || '',
      nameEn: product.name.en || '',
      descriptionAr: product.description?.ar || '',
      descriptionEn: product.description?.en || '',
      price: product.price.toString(),
      compareAtPrice: product.compare_at_price?.toString() || '',
      stockQuantity: product.stock_quantity.toString(),
      trackInventory: product.track_inventory,
      status: product.status,
      sku: product.sku || '',
      barcode: product.barcode || '',
      images: product.images || [],
    });

    try {
      // Load variants and options
      const { data: variantsData } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', product.id)
        .order('sort_order');

      if (variantsData && variantsData.length > 0) {
        const variantIds = variantsData.map((v) => v.id);
        const { data: optionsData } = await supabase
          .from('variant_options')
          .select('*')
          .in('variant_id', variantIds)
          .order('sort_order');

        const parsedVariants: VariantFormData[] = variantsData.map((v) => {
          const variant = parseVariant(v);
          const options = (optionsData || [])
            .filter((o) => o.variant_id === v.id)
            .map((o) => {
              const opt = parseVariantOption(o);
              return {
                id: opt.id,
                labelAr: opt.label.ar,
                labelEn: opt.label.en,
                value: opt.value,
                priceModifier: opt.price_modifier.toString(),
                isDefault: opt.is_default,
              };
            });

          return {
            id: variant.id,
            nameAr: variant.name.ar,
            nameEn: variant.name.en,
            displayType: variant.display_type,
            optionType: variant.option_type,
            required: variant.required,
            options,
          };
        });

        setVariants(parsedVariants);
      } else {
        setVariants([]);
      }

      // Load upsell offers
      const { data: upsellData } = await supabase
        .from('upsell_offers')
        .select('*')
        .eq('product_id', product.id)
        .order('sort_order');

      if (upsellData && upsellData.length > 0) {
        const parsedOffers: UpsellFormData[] = upsellData.map((o) => {
          const offer = parseUpsellOffer(o);
          return {
            id: offer.id,
            minQuantity: offer.min_quantity.toString(),
            discountType: offer.discount_type,
            discountValue: offer.discount_value.toString(),
            labelAr: offer.label?.ar || '',
            labelEn: offer.label?.en || '',
            badgeAr: offer.badge?.ar || '',
            badgeEn: offer.badge?.en || '',
            isActive: offer.is_active,
          };
        });
        setUpsellOffers(parsedOffers);
      } else {
        setUpsellOffers([]);
      }
    } catch (error) {
      console.error('Error loading product data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nameAr && !formData.nameEn) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يجب إدخال اسم المنتج' : 'Product name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يجب إدخال سعر صحيح' : 'Valid price is required',
        variant: 'destructive',
      });
      return;
    }

    if (formData.images.length === 0) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يجب إضافة صورة واحدة على الأقل' : 'At least one image is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const productData = {
        store_id: storeId,
        name: { ar: formData.nameAr, en: formData.nameEn },
        description: { ar: formData.descriptionAr, en: formData.descriptionEn },
        price: parseFloat(formData.price),
        compare_at_price: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        stock_quantity: parseInt(formData.stockQuantity) || 0,
        track_inventory: formData.trackInventory,
        status: formData.status,
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        images: formData.images,
      };

      let savedProduct: Product;

      if (product) {
        // Update existing product
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .select()
          .single();

        if (error) throw error;
        savedProduct = parseProduct(data);

        // Update variants
        await saveVariants(product.id);

        // Update upsell offers
        await saveUpsellOffers(product.id);

        toast({
          title: language === 'ar' ? 'تم التحديث' : 'Updated',
          description: language === 'ar' ? 'تم تحديث المنتج بنجاح' : 'Product updated successfully',
        });

        onSave(savedProduct, false);
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) throw error;
        savedProduct = parseProduct(data);

        // Save variants for new product
        await saveVariants(savedProduct.id);

        // Save upsell offers for new product
        await saveUpsellOffers(savedProduct.id);

        toast({
          title: language === 'ar' ? 'تمت الإضافة' : 'Added',
          description: language === 'ar' ? 'تمت إضافة المنتج بنجاح' : 'Product added successfully',
        });

        onSave(savedProduct, true);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل حفظ المنتج' : 'Failed to save product',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveVariants = async (productId: string) => {
    // Delete existing variants (cascade will delete options)
    await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', productId);

    // Insert new variants
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .insert({
          product_id: productId,
          name: { ar: v.nameAr, en: v.nameEn },
          display_type: v.displayType,
          option_type: v.optionType,
          sort_order: i,
          required: v.required,
        })
        .select()
        .single();

      if (variantError) throw variantError;

      // Insert options for this variant
      if (v.options.length > 0) {
        const optionsToInsert = v.options.map((opt, j) => ({
          variant_id: variantData.id,
          label: { ar: opt.labelAr, en: opt.labelEn },
          value: opt.value,
          price_modifier: parseFloat(opt.priceModifier) || 0,
          sort_order: j,
          is_default: opt.isDefault,
        }));

        const { error: optionsError } = await supabase
          .from('variant_options')
          .insert(optionsToInsert);

        if (optionsError) throw optionsError;
      }
    }
  };

  const saveUpsellOffers = async (productId: string) => {
    // Delete existing offers
    await supabase
      .from('upsell_offers')
      .delete()
      .eq('product_id', productId);

    // Insert new offers
    if (upsellOffers.length > 0) {
      const offersToInsert = upsellOffers.map((o, i) => ({
        product_id: productId,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product
              ? language === 'ar'
                ? 'تعديل المنتج'
                : 'Edit Product'
              : language === 'ar'
                ? 'إضافة منتج جديد'
                : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="basic">
                  {language === 'ar' ? 'الأساسي' : 'Basic'}
                </TabsTrigger>
                <TabsTrigger value="images">
                  {language === 'ar' ? 'الصور' : 'Images'}
                </TabsTrigger>
                <TabsTrigger value="variants">
                  {language === 'ar' ? 'المتغيرات' : 'Variants'}
                </TabsTrigger>
                <TabsTrigger value="upsell">
                  {language === 'ar' ? 'العروض' : 'Offers'}
                </TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-6 mt-6">
                {/* Names */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nameAr">
                      {language === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'}
                    </Label>
                    <Input
                      id="nameAr"
                      value={formData.nameAr}
                      onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                      placeholder={language === 'ar' ? 'اسم المنتج بالعربية' : 'Product name in Arabic'}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nameEn">
                      {language === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}
                    </Label>
                    <Input
                      id="nameEn"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      placeholder={language === 'ar' ? 'اسم المنتج بالإنجليزية' : 'Product name in English'}
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="descriptionAr">
                      {language === 'ar' ? 'الوصف بالعربية' : 'Description (Arabic)'}
                    </Label>
                    <Textarea
                      id="descriptionAr"
                      value={formData.descriptionAr}
                      onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                      placeholder={language === 'ar' ? 'وصف المنتج بالعربية' : 'Product description in Arabic'}
                      dir="rtl"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionEn">
                      {language === 'ar' ? 'الوصف بالإنجليزية' : 'Description (English)'}
                    </Label>
                    <Textarea
                      id="descriptionEn"
                      value={formData.descriptionEn}
                      onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                      placeholder={language === 'ar' ? 'وصف المنتج بالإنجليزية' : 'Product description in English'}
                      dir="ltr"
                      rows={3}
                    />
                  </div>
                </div>

                <Separator />

                {/* Pricing */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      {language === 'ar' ? 'السعر' : 'Price'} ({getCurrencyLabel()})
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compareAtPrice">
                      {language === 'ar' ? 'السعر قبل الخصم' : 'Compare at Price'} ({getCurrencyLabel()})
                    </Label>
                    <Input
                      id="compareAtPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.compareAtPrice}
                      onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Inventory */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="trackInventory">
                      {language === 'ar' ? 'تتبع المخزون' : 'Track Inventory'}
                    </Label>
                    <Switch
                      id="trackInventory"
                      checked={formData.trackInventory}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, trackInventory: checked })
                      }
                    />
                  </div>
                  {formData.trackInventory && (
                    <div className="space-y-2">
                      <Label htmlFor="stockQuantity">
                        {language === 'ar' ? 'الكمية المتوفرة' : 'Stock Quantity'}
                      </Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        min="0"
                        value={formData.stockQuantity}
                        onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {/* SKU & Barcode */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder={language === 'ar' ? 'رمز المنتج' : 'Stock keeping unit'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcode">
                      {language === 'ar' ? 'الباركود' : 'Barcode'}
                    </Label>
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder={language === 'ar' ? 'رمز الباركود' : 'Barcode number'}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الحالة' : 'Status'}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">
                        {language === 'ar' ? 'مسودة' : 'Draft'}
                      </SelectItem>
                      <SelectItem value="active">
                        {language === 'ar' ? 'نشط' : 'Active'}
                      </SelectItem>
                      <SelectItem value="archived">
                        {language === 'ar' ? 'مؤرشف' : 'Archived'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images" className="mt-6">
                <ProductImageUpload
                  images={formData.images}
                  storeId={storeId}
                  productId={product?.id}
                  onImagesChange={(images) => setFormData({ ...formData, images })}
                />
              </TabsContent>

              {/* Variants Tab */}
              <TabsContent value="variants" className="mt-6">
                <VariantManager
                  variants={variants}
                  onChange={setVariants}
                  currency={currency}
                  storeId={storeId}
                />
              </TabsContent>

              {/* Upsell Tab */}
              <TabsContent value="upsell" className="mt-6">
                <UpsellManager
                  offers={upsellOffers}
                  onChange={setUpsellOffers}
                  currency={currency}
                  basePrice={parseFloat(formData.price) || 0}
                />
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                {product
                  ? language === 'ar'
                    ? 'تحديث'
                    : 'Update'
                  : language === 'ar'
                    ? 'إضافة'
                    : 'Add'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
