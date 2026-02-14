
import { useCheckout } from '@/contexts/CheckoutContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { governorates } from '@/lib/governorates';
import { ComponentSchema } from '@/lib/store-builder/types';

interface CheckoutFormProps extends ComponentSchema { }

export function CheckoutForm({ data }: { data: ComponentSchema }) {
    const { settings, content } = data;
    const { language } = useLanguage();
    const {
        formData, setFormData,
        selectedGovernorate, setSelectedGovernorate,
        store, formatPrice, shippingCost
    } = useCheckout();

    const shippingSettings = store.settings?.shipping || { type: 'fixed', fixed_price: 0 };
    const title = typeof content.title === 'string' ? content.title : (content.title?.[language] || 'Customer Information');

    const inputClass = settings.inputStyle === 'filled' ? 'bg-slate-100 border-0' :
        settings.inputStyle === 'underline' ? 'rounded-none border-0 border-b bg-transparent px-0' : '';

    return (
        <Card className="w-full">
            <CardHeader className={settings.backgroundColor ? `bg-${settings.backgroundColor}` : ''}>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <form id="checkout-form" onSubmit={(e) => e.preventDefault()} className="space-y-6">
                    <div className={settings.layout === 'split' ? "grid md:grid-cols-2 gap-4" : "space-y-4"}>
                        <div className="space-y-2">
                            {settings.showLabels && <Label htmlFor="name">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</Label>}
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder={language === 'ar' ? 'الاسم' : 'Name'}
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-2">
                            {settings.showLabels && <Label htmlFor="phone">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>}
                            <Input
                                id="phone"
                                required
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="05xxxxxxxx"
                                dir="ltr"
                                className={`text-right ${inputClass}`}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        {settings.showLabels && <Label htmlFor="alt_phone">{language === 'ar' ? 'رقم هاتف بديل (اختياري)' : 'Alternative Phone (Optional)'}</Label>}
                        <Input
                            id="alt_phone"
                            type="tel"
                            value={formData.alt_phone}
                            onChange={e => setFormData({ ...formData, alt_phone: e.target.value })}
                            placeholder="05xxxxxxxx"
                            dir="ltr"
                            className={`text-right ${inputClass}`}
                        />
                    </div>

                    <div className="space-y-2">
                        {settings.showLabels && <Label htmlFor="city">{language === 'ar' ? 'المدينة / المحافظة' : 'City / Governorate'}</Label>}
                        {shippingSettings.type === 'dynamic' ? (
                            <select
                                id="city"
                                required
                                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${inputClass}`}
                                value={selectedGovernorate}
                                onChange={e => setSelectedGovernorate(e.target.value)}
                            >
                                <option value="" disabled>{language === 'ar' ? 'اختر المحافظة' : 'Select Governorate'}</option>
                                {governorates.map(gov => (
                                    <option key={gov.id} value={gov.id}>
                                        {language === 'ar' ? gov.ar : gov.en} ({formatPrice(Number(shippingSettings.governorate_prices?.[gov.id]) || 0)})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <Input
                                id="city"
                                required
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                placeholder={language === 'ar' ? 'اسم مدينتك' : 'Your City'}
                                className={inputClass}
                            />
                        )}
                    </div>

                    <div className="space-y-2">
                        {settings.showLabels && <Label htmlFor="address">{language === 'ar' ? 'العنوان التفصيلي' : 'Address Details'}</Label>}
                        <Textarea
                            id="address"
                            required
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            placeholder={language === 'ar' ? 'الحي، الشارع، رقم المنزل...' : 'District, Street, House No...'}
                            className={inputClass}
                        />
                    </div>

                    <div className="space-y-2">
                        {settings.showLabels && <Label htmlFor="notes">{language === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Order Notes (Optional)'}</Label>}
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className={inputClass}
                        />
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
