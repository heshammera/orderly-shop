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
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Tag, Sparkles } from 'lucide-react';
import type { DiscountType } from '@/types/variant';

export interface UpsellFormData {
  id?: string;
  minQuantity: string;
  discountType: DiscountType;
  discountValue: string;
  labelAr: string;
  labelEn: string;
  badgeAr: string;
  badgeEn: string;
  isActive: boolean;
}

interface UpsellManagerProps {
  offers: UpsellFormData[];
  onChange: (offers: UpsellFormData[]) => void;
  currency: string;
  basePrice: number;
}

export function UpsellManager({ offers, onChange, currency, basePrice }: UpsellManagerProps) {
  const { language } = useLanguage();

  const addOffer = () => {
    onChange([
      ...offers,
      {
        minQuantity: '2',
        discountType: 'percentage',
        discountValue: '10',
        labelAr: '',
        labelEn: '',
        badgeAr: '',
        badgeEn: '',
        isActive: true,
      },
    ]);
  };

  const updateOffer = (index: number, data: Partial<UpsellFormData>) => {
    const updated = [...offers];
    updated[index] = { ...updated[index], ...data };
    onChange(updated);
  };

  const removeOffer = (index: number) => {
    onChange(offers.filter((_, i) => i !== index));
  };

  const getCurrencyLabel = () => {
    const labels: Record<string, string> = {
      SAR: language === 'ar' ? 'ر.س' : 'SAR',
      USD: language === 'ar' ? 'دولار' : 'USD',
      EUR: language === 'ar' ? 'يورو' : 'EUR',
    };
    return labels[currency] || currency;
  };

  const calculateSavings = (offer: UpsellFormData): string => {
    const qty = parseInt(offer.minQuantity) || 0;
    const discount = parseFloat(offer.discountValue) || 0;
    
    if (qty <= 0 || discount <= 0 || basePrice <= 0) return '';
    
    const originalTotal = basePrice * qty;
    let finalPrice: number;
    
    if (offer.discountType === 'percentage') {
      finalPrice = originalTotal * (1 - discount / 100);
    } else {
      finalPrice = originalTotal - discount;
    }
    
    const savings = originalTotal - finalPrice;
    return savings > 0 ? savings.toFixed(2) : '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <Label className="text-base font-medium">
            {language === 'ar' ? 'عروض الكميات (Upsell)' : 'Quantity Offers (Upsell)'}
          </Label>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addOffer}>
          <Plus className="w-4 h-4 me-1" />
          {language === 'ar' ? 'إضافة عرض' : 'Add Offer'}
        </Button>
      </div>

      {offers.length === 0 ? (
        <Card className="p-6 text-center">
          <Tag className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {language === 'ar'
              ? 'أضف عروض خاصة على الكميات لزيادة المبيعات'
              : 'Add quantity-based offers to boost sales'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {language === 'ar'
              ? 'مثال: اشترِ 3 ووفر 15%'
              : 'Example: Buy 3 and save 15%'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {offers.map((offer, index) => {
            const savings = calculateSavings(offer);
            return (
              <Card key={index} className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {language === 'ar' ? `عرض ${index + 1}` : `Offer ${index + 1}`}
                    </span>
                    {savings && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        {language === 'ar' ? 'توفير' : 'Save'} {savings} {getCurrencyLabel()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={offer.isActive}
                      onCheckedChange={(checked) => updateOffer(index, { isActive: checked })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeOffer(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Quantity and discount */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'الحد الأدنى للكمية' : 'Min Quantity'}</Label>
                    <Input
                      type="number"
                      min="2"
                      value={offer.minQuantity}
                      onChange={(e) => updateOffer(index, { minQuantity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'نوع الخصم' : 'Discount Type'}</Label>
                    <Select
                      value={offer.discountType}
                      onValueChange={(value: DiscountType) =>
                        updateOffer(index, { discountType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">
                          {language === 'ar' ? 'نسبة مئوية %' : 'Percentage %'}
                        </SelectItem>
                        <SelectItem value="fixed">
                          {language === 'ar' ? `مبلغ ثابت (${getCurrencyLabel()})` : `Fixed (${getCurrencyLabel()})`}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {language === 'ar' ? 'قيمة الخصم' : 'Discount Value'}
                      {offer.discountType === 'percentage' ? ' (%)' : ` (${getCurrencyLabel()})`}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step={offer.discountType === 'percentage' ? '1' : '0.01'}
                      value={offer.discountValue}
                      onChange={(e) => updateOffer(index, { discountValue: e.target.value })}
                    />
                  </div>
                </div>

                {/* Labels */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'نص العرض بالعربية' : 'Offer Text (Arabic)'}</Label>
                    <Input
                      value={offer.labelAr}
                      onChange={(e) => updateOffer(index, { labelAr: e.target.value })}
                      placeholder={language === 'ar' ? 'مثال: اشترِ 3 ووفر 15%' : 'e.g., Buy 3 save 15%'}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'نص العرض بالإنجليزية' : 'Offer Text (English)'}</Label>
                    <Input
                      value={offer.labelEn}
                      onChange={(e) => updateOffer(index, { labelEn: e.target.value })}
                      placeholder={language === 'ar' ? 'Buy 3 save 15%' : 'e.g., Buy 3 save 15%'}
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Badges */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'شارة العرض بالعربية' : 'Badge (Arabic)'}</Label>
                    <Input
                      value={offer.badgeAr}
                      onChange={(e) => updateOffer(index, { badgeAr: e.target.value })}
                      placeholder={language === 'ar' ? 'مثال: الأكثر طلباً' : 'e.g., Popular'}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'شارة العرض بالإنجليزية' : 'Badge (English)'}</Label>
                    <Input
                      value={offer.badgeEn}
                      onChange={(e) => updateOffer(index, { badgeEn: e.target.value })}
                      placeholder={language === 'ar' ? 'Popular' : 'e.g., Popular'}
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Preview */}
                {(offer.labelAr || offer.labelEn) && (
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20">
                    <p className="text-sm font-medium text-center">
                      {language === 'ar' ? 'معاينة:' : 'Preview:'}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      {(offer.badgeAr || offer.badgeEn) && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                          {language === 'ar' ? offer.badgeAr || offer.badgeEn : offer.badgeEn || offer.badgeAr}
                        </span>
                      )}
                      <span className="text-sm">
                        {language === 'ar' ? offer.labelAr || offer.labelEn : offer.labelEn || offer.labelAr}
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
