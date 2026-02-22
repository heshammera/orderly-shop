"use client";

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { governorates } from '@/lib/governorates';

interface QuickOrderFormProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    quantity: number;
    variants: any[];
    selections: Record<number, Record<string, string>>; // itemIndex -> variantId -> optionId
    store: any;
}

export function QuickOrderForm({ isOpen, onClose, product, quantity, variants, selections, store }: QuickOrderFormProps) {
    const { language } = useLanguage();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        alt_phone: '',
        address: '',
        city: '',
        notes: ''
    });

    const [selectedGovernorate, setSelectedGovernorate] = useState<string>('');

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: store.currency,
        }).format(price);
    };

    // Calculate Prices
    const calculateTotal = () => {
        let itemsTotal = 0;
        for (let i = 0; i < quantity; i++) {
            let itemPrice = product.price;
            const itemSelections = selections[i] || {};

            variants.forEach(v => {
                const selectedOptionId = itemSelections[v.id];
                const selectedOption = v.options.find((o: any) => o.id === selectedOptionId);
                if (selectedOption?.price_modifier) {
                    itemPrice += selectedOption.price_modifier;
                }
            });
            itemsTotal += itemPrice;
        }
        return itemsTotal;
    };

    const subtotal = calculateTotal();

    // Shipping Logic
    const shippingSettings = store.settings?.shipping || { type: 'fixed', fixed_price: 0 };
    const shippingCost = (() => {
        if (shippingSettings.type === 'fixed') {
            return Number(shippingSettings.fixed_price) || 0;
        } else if (shippingSettings.type === 'dynamic') {
            if (!selectedGovernorate) return 0;
            return Number(shippingSettings.governorate_prices?.[selectedGovernorate]) || 0;
        }
        return 0;
    })();

    const total = subtotal + shippingCost;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!store?.id) return;

        if (shippingSettings.type === 'dynamic' && !selectedGovernorate) {
            toast({
                title: language === 'ar' ? 'تنبيه' : 'Alert',
                description: language === 'ar' ? 'يرجى اختيار المحافظة لحساب الشحن' : 'Please select a governorate to calculate shipping',
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            // Resolve City/Governorate Name
            let cityOrGovName = formData.city;
            if (shippingSettings.type === 'dynamic' && selectedGovernorate) {
                const gov = governorates.find(g => g.id === selectedGovernorate);
                cityOrGovName = gov ? (language === 'ar' ? gov.ar : gov.en) : selectedGovernorate;
            }

            // Use server-side API route to bypass RLS
            const response = await fetch('/api/checkout/quick-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    store_id: store.id,
                    product: {
                        id: product.id,
                        name: product.name,
                        price: product.price
                    },
                    quantity,
                    variants,
                    selections,
                    formData: {
                        ...formData,
                        city: cityOrGovName
                    },
                    selectedGovernorate,
                    shippingCost,
                    subtotal,
                    total,
                    currency: store.currency
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to place order');
            }

            setOrderId(result.order_number);
            setSuccess(true);
            toast({
                title: language === 'ar' ? 'تم الطلب بنجاح' : 'Order Placed Successfully',
                description: language === 'ar' ? `رقم الطلب: ${result.order_number}` : `Order #${result.order_number}`,
            });

        } catch (error: any) {
            console.error('Quick Order Error:', error);
            toast({
                title: language === 'ar' ? 'خطأ في الطلب' : 'Order Failed',
                description: error.message || 'حدث خطأ غير متوقع',
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const resetAndClose = () => {
        setSuccess(false);
        setFormData({
            name: '',
            phone: '',
            alt_phone: '',
            address: '',
            city: '',
            notes: ''
        });
        setSelectedGovernorate('');
        onClose();
    };

    if (success) {
        return (
            <Dialog open={isOpen} onOpenChange={resetAndClose}>
                <DialogContent className="sm:max-w-md text-center">
                    <div className="flex flex-col items-center justify-center py-6">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <DialogTitle className="text-2xl font-bold mb-2">
                            {language === 'ar' ? 'شكراً لطلبك!' : 'Thank You!'}
                        </DialogTitle>
                        <DialogDescription className="text-lg">
                            {language === 'ar' ? `تم استلام طلبك رقم #${orderId}` : `Order #${orderId} Received`}
                        </DialogDescription>
                        <p className="text-muted-foreground mt-2">
                            {language === 'ar' ? 'سيتم التواصل معك قريباً لتأكيد الطلب.' : 'We will contact you soon to confirm.'}
                        </p>
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button onClick={resetAndClose} size="lg">
                            {language === 'ar' ? 'متابعة التسوق' : 'Continue Shopping'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{language === 'ar' ? 'طلب سريع' : 'Quick Order'}</DialogTitle>
                    <DialogDescription>
                        {product.name[language] || product.name.ar} x {quantity}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="qo-name">{language === 'ar' ? 'الاسم' : 'Name'}</Label>
                            <Input
                                id="qo-name"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="qo-phone">{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</Label>
                            <Input
                                id="qo-phone"
                                required
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="qo-alt-phone">{language === 'ar' ? 'رقم بديل (اختياري)' : 'Alt Phone (Optional)'}</Label>
                        <Input
                            id="qo-alt-phone"
                            type="tel"
                            value={formData.alt_phone}
                            onChange={e => setFormData({ ...formData, alt_phone: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="qo-city">{language === 'ar' ? 'المحافظة / المدينة' : 'Governorate / City'}</Label>
                        {shippingSettings.type === 'dynamic' ? (
                            <select
                                id="qo-city"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedGovernorate}
                                onChange={e => setSelectedGovernorate(e.target.value)}
                            >
                                <option value="" disabled selected={!selectedGovernorate}>{language === 'ar' ? 'اختر المحافظة' : 'Select Governorate'}</option>
                                {governorates.map(gov => (
                                    <option key={gov.id} value={gov.id}>
                                        {language === 'ar' ? gov.ar : gov.en} ({formatPrice(Number(shippingSettings.governorate_prices?.[gov.id]) || 0)})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <Input
                                id="qo-city"
                                required
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                placeholder={language === 'ar' ? 'اسم مدينتك' : 'Your City'}
                            />
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="qo-address">{language === 'ar' ? 'العنوان' : 'Address'}</Label>
                        <Textarea
                            id="qo-address"
                            required
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            placeholder={language === 'ar' ? 'العنوان بالتفصيل...' : 'Detailed address...'}
                        />
                    </div>

                    <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>{language === 'ar' ? 'سعر المنتج' : 'Product Price'}</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                            <span className={shippingCost === 0 ? "text-green-600" : ""}>
                                {shippingCost === 0
                                    ? (language === 'ar' ? 'مجاني' : 'Free')
                                    : formatPrice(shippingCost)}
                            </span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                            <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                            <span className="text-primary">{formatPrice(total)}</span>
                        </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {language === 'ar' ? 'تأكيد الطلب السريع' : 'Confirm Quick Order'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
