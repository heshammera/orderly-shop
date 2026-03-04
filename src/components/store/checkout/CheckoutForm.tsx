
import { useCheckout } from '@/contexts/CheckoutContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { governorates } from '@/lib/governorates';
import { ComponentSchema, COMPONENT_DEFAULTS } from '@/lib/store-builder/types';

interface CheckoutFormProps extends ComponentSchema { }

// Default formFields fallback (for backward compatibility with stores that don't have formFields yet)
const DEFAULT_FORM_FIELDS = (COMPONENT_DEFAULTS.CheckoutForm.settings as any).formFields;

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

    // Use Theme Engine checkoutFields if available, otherwise fall back to legacy formFields
    const formFields: any[] = settings.checkoutFields && settings.checkoutFields.length > 0
        ? settings.checkoutFields
        : (settings.formFields || DEFAULT_FORM_FIELDS);

    // Filter visible fields and sort by order
    const visibleFields = [...formFields]
        .filter((f: any) => f.visible !== false)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    // Render a single field based on its config
    const renderField = (field: any) => {
        const isLegacy = !field.type;
        const fieldId = isLegacy ? field.id : (field.type === 'checkout_field' ? field.field_id : field.id);

        // Helper to safely extract strings from potentially localized objects
        const resolveStringValue = (val: any, fallback: string = '') => {
            if (!val) return fallback;
            if (typeof val === 'object') return val[language] || val.ar || val.en || fallback;
            return String(val);
        };

        let fieldLabel = '';
        if (isLegacy) {
            fieldLabel = resolveStringValue(field.label, field.id);
        } else {
            const standardLabels: any = {
                name: language === 'ar' ? 'الاسم الكامل' : 'Full Name',
                phone: language === 'ar' ? 'رقم الجوال' : 'Phone Number',
                alt_phone: language === 'ar' ? 'رقم جوال بديل' : 'Alt Phone',
                email: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
                governorate: language === 'ar' ? 'المحافظة/المنطقة' : 'Governorate',
                city: language === 'ar' ? 'المدينة' : 'City',
                address: language === 'ar' ? 'العنوان التفصيلي' : 'Address',
                notes: language === 'ar' ? 'ملاحظات' : 'Notes',
            };
            fieldLabel = field.type === 'checkout_field' ? resolveStringValue(standardLabels[field.field_id], field.field_id) : resolveStringValue(field.label, field.id);
        }

        const isRequired = field.required;
        const placeholder = resolveStringValue(field.placeholder, '');

        // Handle custom input types
        if (field.type === 'custom_text_field') {
            return (
                <div key={fieldId} className="space-y-2">
                    <Label htmlFor={fieldId} className="text-sm font-medium text-slate-700">
                        {fieldLabel} {!isRequired && <span className="text-slate-400 text-xs">({language === 'ar' ? 'اختياري' : 'Optional'})</span>}
                    </Label>
                    <Input
                        id={fieldId}
                        required={isRequired}
                        value={formData[fieldId] || ''}
                        onChange={e => setFormData({ ...formData, [fieldId]: e.target.value })}
                        placeholder={placeholder || fieldLabel}
                        className="h-11 border-slate-200 focus:border-primary focus:ring-primary/10 transition-all"
                    />
                </div>
            );
        }

        if (field.type === 'custom_textarea_field') {
            return (
                <div key={fieldId} className="space-y-2">
                    <Label htmlFor={fieldId} className="text-sm font-medium text-slate-700">
                        {fieldLabel} {!isRequired && <span className="text-slate-400 text-xs">({language === 'ar' ? 'اختياري' : 'Optional'})</span>}
                    </Label>
                    <Textarea
                        id={fieldId}
                        required={isRequired}
                        value={formData[fieldId] || ''}
                        onChange={e => setFormData({ ...formData, [fieldId]: e.target.value })}
                        placeholder={placeholder || fieldLabel}
                        className="min-h-[80px] border-slate-200 focus:border-primary focus:ring-primary/10 transition-all resize-none"
                    />
                </div>
            );
        }

        // Standard inputs
        switch (fieldId) {
            case 'name':
                return (
                    <div key={fieldId} className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                            {fieldLabel} {!isRequired && <span className="text-slate-400 text-xs">({language === 'ar' ? 'اختياري' : 'Optional'})</span>}
                        </Label>
                        <Input
                            id="name"
                            required={isRequired}
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder={placeholder || (language === 'ar' ? 'ادخل اسمك الكامل' : 'Enter your full name')}
                            className="h-11 border-slate-200 focus:border-primary focus:ring-primary/10 transition-all"
                        />
                    </div>
                );

            case 'phone':
                return (
                    <div key={fieldId} className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                            {fieldLabel} {!isRequired && <span className="text-slate-400 text-xs">({language === 'ar' ? 'اختياري' : 'Optional'})</span>}
                        </Label>
                        <Input
                            id="phone"
                            required={isRequired}
                            type="tel"
                            value={formData.phone || ''}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder={placeholder || '05xxxxxxxx'}
                            dir="ltr"
                            className="h-11 border-slate-200 focus:border-primary focus:ring-primary/10 transition-all"
                        />
                    </div>
                );

            case 'alt_phone':
                return (
                    <div key={fieldId} className="space-y-2">
                        <Label htmlFor="alt_phone" className="text-sm font-medium text-slate-700">
                            {fieldLabel} {!isRequired && <span className="text-slate-400 text-xs">({language === 'ar' ? 'اختياري' : 'Optional'})</span>}
                        </Label>
                        <Input
                            id="alt_phone"
                            required={isRequired}
                            type="tel"
                            value={formData.alt_phone || ''}
                            onChange={e => setFormData({ ...formData, alt_phone: e.target.value })}
                            placeholder={placeholder || '05xxxxxxxx'}
                            dir="ltr"
                            className="h-11 border-slate-200 focus:border-primary focus:ring-primary/10 transition-all"
                        />
                    </div>
                );

            case 'email':
                return (
                    <div key={fieldId} className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                            {fieldLabel} {!isRequired && <span className="text-slate-400 text-xs">({language === 'ar' ? 'اختياري' : 'Optional'})</span>}
                        </Label>
                        <Input
                            id="email"
                            required={isRequired}
                            type="email"
                            value={formData.email || ''}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder={placeholder || (language === 'ar' ? 'example@domain.com' : 'example@domain.com')}
                            dir="ltr"
                            className="h-11 border-slate-200 focus:border-primary focus:ring-primary/10 transition-all"
                        />
                    </div>
                );

            case 'governorate':
            case 'city':
                return (
                    <div key={fieldId} className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium text-slate-700">
                            {fieldLabel} {!isRequired && <span className="text-slate-400 text-xs">({language === 'ar' ? 'اختياري' : 'Optional'})</span>}
                        </Label>
                        {shippingSettings.type === 'dynamic' ? (
                            <select
                                id="city"
                                required={isRequired}
                                className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                value={selectedGovernorate}
                                onChange={e => setSelectedGovernorate(e.target.value)}
                            >
                                <option value="" disabled>{placeholder || (language === 'ar' ? 'اختر المحافظة' : 'Select Governorate')}</option>
                                {governorates.map(gov => (
                                    <option key={gov.id} value={gov.id}>
                                        {language === 'ar' ? gov.ar : gov.en} ({formatPrice(Number(shippingSettings.governorate_prices?.[gov.id]) || 0)})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <Input
                                id="city"
                                required={isRequired}
                                value={formData.city || ''}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                placeholder={placeholder || (language === 'ar' ? 'اسم مدينتك' : 'Your City')}
                                className="h-11 border-slate-200 focus:border-primary focus:ring-primary/10 transition-all"
                            />
                        )}
                    </div>
                );

            case 'address':
                return (
                    <div key={fieldId} className="space-y-2">
                        <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                            {fieldLabel} {!isRequired && <span className="text-slate-400 text-xs">({language === 'ar' ? 'اختياري' : 'Optional'})</span>}
                        </Label>
                        <Textarea
                            id="address"
                            required={isRequired}
                            value={formData.address || ''}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            placeholder={placeholder || (language === 'ar' ? 'الحي، الشارع، رقم المنزل...' : 'District, Street, House No...')}
                            className="min-h-[100px] border-slate-200 focus:border-primary focus:ring-primary/10 transition-all resize-none"
                        />
                    </div>
                );

            case 'notes':
                return (
                    <div key={fieldId} className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
                            {fieldLabel} {!isRequired && <span className="text-slate-400 text-xs">({language === 'ar' ? 'اختياري' : 'Optional'})</span>}
                        </Label>
                        <Textarea
                            id="notes"
                            required={isRequired}
                            value={formData.notes || ''}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder={placeholder || (language === 'ar' ? 'لديك أي تعليمات خاصة؟' : 'Any special instructions?')}
                            className="min-h-[80px] border-slate-200 focus:border-primary focus:ring-primary/10 transition-all resize-none"
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    // If using Theme Engine fields, we just render them all sequentially.
    // If legacy, we split them into contact and shipping for backwards compatibility.
    const isThemeEngine = settings.checkoutFields && settings.checkoutFields.length > 0;

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
                    {isThemeEngine ? (
                        <div className="space-y-6">
                            {visibleFields.map(renderField)}
                        </div>
                    ) : (
                        // Legacy Layout
                        <>
                            {/* Section 1: Contact Info */}
                            {visibleFields.filter(f => ['name', 'phone', 'alt_phone', 'email'].includes(f.id)).length > 0 && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                                        <span className="flex items-center justify-center w-5 h-5 bg-slate-100 rounded text-[10px] text-slate-500">1</span>
                                        {language === 'ar' ? 'بيانات التواصل' : 'Contact Information'}
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-5">
                                        {visibleFields.filter(f => ['name', 'phone', 'alt_phone', 'email'].includes(f.id)).slice(0, 2).map(renderField)}
                                    </div>
                                    {visibleFields.filter(f => ['name', 'phone', 'alt_phone', 'email'].includes(f.id)).slice(2).map(renderField)}
                                </div>
                            )}

                            {/* Section 2: Shipping Info */}
                            {visibleFields.filter(f => ['city', 'address', 'notes'].includes(f.id)).length > 0 && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                                        <span className="flex items-center justify-center w-5 h-5 bg-slate-100 rounded text-[10px] text-slate-500">
                                            {visibleFields.filter(f => ['name', 'phone', 'alt_phone', 'email'].includes(f.id)).length > 0 ? '2' : '1'}
                                        </span>
                                        {language === 'ar' ? 'تفاصيل الشحن' : 'Shipping Details'}
                                    </div>
                                    {visibleFields.filter(f => ['city', 'address', 'notes'].includes(f.id)).map(renderField)}
                                </div>
                            )}
                        </>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
