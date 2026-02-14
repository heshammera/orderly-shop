"use client";

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { governorates } from '@/lib/governorates';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ShippingSettings {
    type: 'fixed' | 'dynamic'; // 'dynamic' means per governorate
    fixed_price: number;
    governorate_prices: Record<string, number>; // governorate_id -> price
}

interface ShippingTabProps {
    store: any;
    onSave: (data: any) => Promise<void>;
}

export function ShippingTab({ store, onSave }: ShippingTabProps) {
    const { language } = useLanguage();
    const [loading, setLoading] = useState(false);

    const defaultSettings: ShippingSettings = {
        type: 'fixed',
        fixed_price: 0,
        governorate_prices: {}
    };

    const [settings, setSettings] = useState<ShippingSettings>({
        ...defaultSettings,
        ...(store.settings?.shipping || {})
    });

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave({
                settings: {
                    ...store.settings,
                    shipping: settings
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGovernoratePriceChange = (govId: string, price: string) => {
        setSettings(prev => ({
            ...prev,
            governorate_prices: {
                ...prev.governorate_prices,
                [govId]: parseFloat(price) || 0
            }
        }));
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <RadioGroup
                    value={settings.type}
                    onValueChange={(val: 'fixed' | 'dynamic') => setSettings(prev => ({ ...prev, type: val }))}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <div>
                        <RadioGroupItem value="fixed" id="fixed" className="peer sr-only" />
                        <Label
                            htmlFor="fixed"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                            <span className="text-lg font-semibold mb-2">
                                {language === 'ar' ? 'سعر شحن ثابت' : 'Fixed Shipping Price'}
                            </span>
                            <span className="text-sm text-muted-foreground text-center">
                                {language === 'ar'
                                    ? 'تطبيق سعر موحد لجميع المناطق'
                                    : 'Apply a unified price for all regions'}
                            </span>
                        </Label>
                    </div>

                    <div>
                        <RadioGroupItem value="dynamic" id="dynamic" className="peer sr-only" />
                        <Label
                            htmlFor="dynamic"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                            <span className="text-lg font-semibold mb-2">
                                {language === 'ar' ? 'حسب المحافظة' : 'Per Governorate'}
                            </span>
                            <span className="text-sm text-muted-foreground text-center">
                                {language === 'ar'
                                    ? 'تحديد سعر مختلف لكل محافظة'
                                    : 'Set a different price for each governorate'}
                            </span>
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            <Separator />

            {settings.type === 'fixed' ? (
                <div className="space-y-2 max-w-sm">
                    <Label htmlFor="fixed_price">
                        {language === 'ar' ? 'سعر الشحن' : 'Shipping Price'}
                    </Label>
                    <div className="relative">
                        <Input
                            id="fixed_price"
                            type="number"
                            min="0"
                            value={settings.fixed_price}
                            onChange={(e) => setSettings(prev => ({ ...prev, fixed_price: parseFloat(e.target.value) || 0 }))}
                        />
                        <span className="absolute end-3 top-2.5 text-muted-foreground text-sm">
                            {store.currency}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-muted-foreground">
                            {language === 'ar'
                                ? 'يمكنك تحديد سعر لكل محافظة. اترك الحقل فارغاً أو 0 لجعل الشحن مجاني لتلك المحافظة.'
                                : 'You can set a price for each governorate. Leave empty or 0 for free shipping.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {governorates.map(gov => (
                            <Card key={gov.id} className="overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="space-y-2">
                                        <Label htmlFor={`gov-${gov.id}`} className="font-medium">
                                            {language === 'ar' ? gov.ar : gov.en}
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id={`gov-${gov.id}`}
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={settings.governorate_prices[gov.id] || ''}
                                                onChange={(e) => handleGovernoratePriceChange(gov.id, e.target.value)}
                                            />
                                            <span className="absolute end-3 top-2.5 text-muted-foreground text-xs">
                                                {store.currency}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                    {loading
                        ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                        : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')
                    }
                </Button>
            </div>
        </div>
    );
}
