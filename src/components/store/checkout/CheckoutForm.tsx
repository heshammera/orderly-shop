
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
        <Card className="border-none shadow-sm overflow-hidden bg-white ring-1 ring-slate-200">
            <CardHeader className="border-b bg-slate-50/50 py-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-primary rounded-full" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
                <form id="checkout-form" onSubmit={(e) => e.preventDefault()} className="space-y-8">
                    {/* Section 1: Contact Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                            <span className="flex items-center justify-center w-5 h-5 bg-slate-100 rounded text-[10px] text-slate-500">1</span>
                            {language === 'ar' ? 'بيانات التواصل' : 'Contact Information'}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                                    {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                                </Label>
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={language === 'ar' ? 'ادخل اسمك الكامل' : 'Enter your full name'}
                                    className="h-11 border-slate-200 focus:border-primary focus:ring-primary/10 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                                    {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                                </Label>
                                <Input
                                    id="phone"
                                    required
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="05xxxxxxxx"
                                    dir="ltr"
                                    className="h-11 border-slate-200 focus:border-primary focus:ring-primary/10 transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="alt_phone" className="text-sm font-medium text-slate-700">
                                {language === 'ar' ? 'رقم هاتف بديل (اختياري)' : 'Alternative Phone (Optional)'}
                            </Label>
                            <Input
                                id="alt_phone"
                                type="tel"
                                value={formData.alt_phone}
                                onChange={e => setFormData({ ...formData, alt_phone: e.target.value })}
                                placeholder="05xxxxxxxx"
                                dir="ltr"
                                className="h-11 border-slate-200 focus:border-primary focus:ring-primary/10 transition-all"
                            />
                        </div>
                    </div>

                    {/* Section 2: Shipping Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                            <span className="flex items-center justify-center w-5 h-5 bg-slate-100 rounded text-[10px] text-slate-500">2</span>
                            {language === 'ar' ? 'تفاصيل الشحن' : 'Shipping Details'}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city" className="text-sm font-medium text-slate-700">
                                {language === 'ar' ? 'المدينة / المحافظة' : 'City / Governorate'}
                            </Label>
                            {shippingSettings.type === 'dynamic' ? (
                                <select
                                    id="city"
                                    required
                                    className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
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
                                    className="h-11 border-slate-200 focus:border-primary focus:ring-primary/10 transition-all"
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                                {language === 'ar' ? 'العنوان التفصيلي' : 'Address Details'}
                            </Label>
                            <Textarea
                                id="address"
                                required
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                placeholder={language === 'ar' ? 'الحي، الشارع، رقم المنزل...' : 'District, Street, House No...'}
                                className="min-h-[100px] border-slate-200 focus:border-primary focus:ring-primary/10 transition-all resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
                                {language === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Order Notes (Optional)'}
                            </Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder={language === 'ar' ? 'لديك أي تعليمات خاصة؟' : 'Any special instructions?'}
                                className="min-h-[80px] border-slate-200 focus:border-primary focus:ring-primary/10 transition-all resize-none"
                            />
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
