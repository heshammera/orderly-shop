import { useState, useEffect } from 'react';
import { useParams, useOutletContext, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, Ticket, X } from 'lucide-react';
import { governorates } from '@/lib/governorates';

interface StoreContext {
    store: {
        id: string;
        currency: string;
        settings: any;
    };
}

export default function Checkout() {
    const { storeSlug } = useParams<{ storeSlug: string }>();
    const { store } = useOutletContext<StoreContext>();
    const { language } = useLanguage();
    const { cart, cartCount, clearCart } = useCart();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        alt_phone: '',
        address: '',
        city: '', // Used for city name if fixed shipping, or fallback
        notes: ''
    });

    const [selectedGovernorate, setSelectedGovernorate] = useState<string>('');

    const ArrowBack = language === 'ar' ? ArrowRight : ArrowLeft;

    useEffect(() => {
        if (cartCount === 0 && !success) {
            navigate(`/s/${storeSlug}/products`);
        }
    }, [cartCount, success, storeSlug, navigate]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: store.currency,
        }).format(price);
    };

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

    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const total = Math.max(0, subtotal - discount + shippingCost);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setLoading(true);
        try {
            interface Coupon {
                id: string;
                store_id: string;
                code: string;
                discount_type: 'percentage' | 'fixed';
                discount_value: number;
                min_order_amount: number;
                usage_limit: number | null;
                used_count: number;
                starts_at: string;
                expires_at: string | null;
                is_active: boolean;
            }

            const { data: rawData, error } = await supabase
                .from('coupons' as any)
                .select('*')
                .eq('store_id', store.id)
                .eq('code', couponCode)
                .eq('is_active', true)
                .single();

            const data = rawData as unknown as Coupon | null;

            if (error || !data) {
                throw new Error('Invalid coupon code');
            }

            // Validation
            const now = new Date();
            if (data.expires_at && new Date(data.expires_at) < now) {
                throw new Error('Coupon expired');
            }
            if (data.usage_limit && data.used_count >= data.usage_limit) {
                throw new Error('Coupon usage limit reached');
            }
            if (data.min_order_amount && subtotal < data.min_order_amount) {
                throw new Error(`Minimum order amount is ${data.min_order_amount}`);
            }

            // Calculate Discount
            let discountValue = 0;
            if (data.discount_type === 'percentage') {
                discountValue = (subtotal * data.discount_value) / 100;
            } else {
                discountValue = data.discount_value;
            }

            // Cap discount at subtotal
            discountValue = Math.min(discountValue, subtotal);

            setDiscount(discountValue);
            setAppliedCoupon(data);
            toast({
                title: language === 'ar' ? 'تم تطبيق الخصم' : 'Discount Applied',
                description: `${language === 'ar' ? 'تم خصم' : 'Saved'} ${formatPrice(discountValue)}`,
            });
        } catch (error: any) {
            toast({
                title: language === 'ar' ? 'كوبون غير صالح' : 'Invalid Coupon',
                description: error.message === 'Invalid coupon code' ? (language === 'ar' ? 'الكوبون غير موجود أو غير فعال' : 'Coupon not found or inactive') : error.message,
                variant: "destructive"
            });
            setAppliedCoupon(null);
            setDiscount(0);
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceOrder = async (e: React.FormEvent) => {
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

            // 1. Create/Find Customer
            const { data: customerData, error: customerError } = await supabase
                .from('customers')
                .insert({
                    store_id: store.id,
                    name: formData.name,
                    phone: formData.phone,
                    // We store the alt_phone in the address jsonb or notes for now as schema is strict
                    address: {
                        city: cityOrGovName,
                        full_address: formData.address,
                        governorate_id: selectedGovernorate,
                        alt_phone: formData.alt_phone
                    },
                    total_orders: 1,
                    total_spent: total
                })
                .select()
                .single();

            if (customerError) throw customerError;

            const customerId = customerData.id;

            // 2. Create Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    store_id: store.id,
                    customer_id: customerId,
                    order_number: `ORD-${Date.now().toString().slice(-6)}`,
                    status: 'pending',
                    subtotal: subtotal,
                    discount_amount: discount,
                    coupon_code: appliedCoupon?.code || null,
                    subtotal_amount: subtotal, // keeping consistent naming if feasible, usually 'subtotal' column exists from before
                    total: total,
                    shipping_cost: shippingCost,
                    currency: store.currency,
                    customer_snapshot: {
                        name: formData.name,
                        phone: formData.phone,
                        alt_phone: formData.alt_phone,
                        city: cityOrGovName,
                        governorate_id: selectedGovernorate,
                        address: formData.address
                    },
                    shipping_address: {
                        city: cityOrGovName,
                        address: formData.address,
                        governorate_id: selectedGovernorate
                    },
                    notes: formData.notes
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 3. Create Order Items
            const orderItems = cart.map(item => ({
                order_id: orderData.id,
                product_id: item.productId,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total_price: item.unitPrice * item.quantity,
                product_snapshot: {
                    name: item.productName,
                    variants: item.variants
                }
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 4. Increment Coupon Usage (Optional but recommended)
            if (appliedCoupon) {
                const { error } = await supabase.rpc('increment_coupon_usage', {
                    coupon_code: appliedCoupon.code,
                    store_id_param: store.id // Note: RPC param name might need to match exactly
                });

                if (error) {
                    console.error('Failed to increment coupon usage:', error);
                }
            }

            await clearCart();
            setOrderId(orderData.order_number);
            setSuccess(true);
            toast({
                title: language === 'ar' ? 'تم الطلب بنجاح' : 'Order Placed Successfully',
                description: language === 'ar' ? `رقم الطلب: ${orderData.order_number}` : `Order #${orderData.order_number}`,
            });

        } catch (error: any) {
            console.error('Checkout Error:', error);
            toast({
                title: language === 'ar' ? 'خطأ في الطلب' : 'Checkout Failed',
                description: error.message || 'Something went wrong',
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold mb-2">
                    {language === 'ar' ? 'شكراً لطلبك!' : 'Thank You!'}
                </h1>
                <p className="text-muted-foreground mb-6 text-lg">
                    {language === 'ar' ? 'تم استلام طلبك بنجاح وسيتم التواصل معك قريباً.' : 'Your order has been placed successfully and we will contact you soon.'}
                </p>
                <div className="bg-muted p-4 rounded-lg mb-8">
                    <p className="font-medium">
                        {language === 'ar' ? 'رقم الطلب' : 'Order Number'}: <span className="text-primary">{orderId}</span>
                    </p>
                </div>
                <Link to={`/s/${storeSlug}`}>
                    <Button size="lg">
                        {language === 'ar' ? 'العودة للمتجر' : 'Back to Store'}
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowBack className="w-5 h-5" />
                </Button>
                <h1 className="text-2xl font-bold">
                    {language === 'ar' ? 'إتمام الطلب' : 'Checkout'}
                </h1>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Customer Form */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>{language === 'ar' ? 'بيانات العميل' : 'Customer Information'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</Label>
                                        <Input
                                            id="name"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder={language === 'ar' ? 'الاسم' : 'Name'}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
                                        <Input
                                            id="phone"
                                            required
                                            type="tel"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="05xxxxxxxx"
                                            dir="ltr"
                                            className="text-right"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="alt_phone">{language === 'ar' ? 'رقم هاتف بديل (اختياري)' : 'Alternative Phone (Optional)'}</Label>
                                    <Input
                                        id="alt_phone"
                                        type="tel"
                                        value={formData.alt_phone}
                                        onChange={e => setFormData({ ...formData, alt_phone: e.target.value })}
                                        placeholder="05xxxxxxxx"
                                        dir="ltr"
                                        className="text-right"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="city">{language === 'ar' ? 'المدينة / المحافظة' : 'City / Governorate'}</Label>
                                    {shippingSettings.type === 'dynamic' ? (
                                        <select
                                            id="city"
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
                                            id="city"
                                            required
                                            value={formData.city}
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                            placeholder={language === 'ar' ? 'اسم مدينتك' : 'Your City'}
                                        />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">{language === 'ar' ? 'العنوان التفصيلي' : 'Address Details'}</Label>
                                    <Textarea
                                        id="address"
                                        required
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        placeholder={language === 'ar' ? 'الحي، الشارع، رقم المنزل...' : 'District, Street, House No...'}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">{language === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Order Notes (Optional)'}</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle>{language === 'ar' ? 'ملخص الفاتورة' : 'Order Summary'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span>{item.quantity}x {item.productName[language] || item.productName.ar} {item.variants.map(v => `(${v.optionLabel[language] || v.optionLabel.ar})`).join(' ')}</span>
                                        <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            {/* Coupon Section */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder={language === 'ar' ? 'كود الكوبون' : 'Coupon Code'}
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    disabled={!!appliedCoupon}
                                />
                                {appliedCoupon ? (
                                    <Button variant="destructive" size="icon" onClick={() => {
                                        setAppliedCoupon(null);
                                        setDiscount(0);
                                        setCouponCode('');
                                    }}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button onClick={handleApplyCoupon} disabled={!couponCode || loading}>
                                        {language === 'ar' ? 'تطبيق' : 'Apply'}
                                    </Button>
                                )}
                            </div>
                            {appliedCoupon && (
                                <div className="text-sm text-green-600 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {language === 'ar' ? 'تم تطبيق الكوبون بنجاح' : 'Coupon applied successfully'}
                                </div>
                            )}

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{language === 'ar' ? 'المجموع' : 'Subtotal'}</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                                    <span className={shippingCost === 0 ? "text-green-600" : ""}>
                                        {shippingCost === 0
                                            ? (language === 'ar' ? 'مجاني' : 'Free')
                                            : formatPrice(shippingCost)
                                        }
                                    </span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>{language === 'ar' ? 'الخصم' : 'Discount'} ({appliedCoupon?.code})</span>
                                        <span>-{formatPrice(discount)}</span>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="flex justify-between text-lg font-bold">
                                <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                                <span className="text-primary">{formatPrice(total)}</span>
                            </div>

                            <Button
                                type="submit"
                                form="checkout-form"
                                size="lg"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {language === 'ar' ? 'تأكيد الطلب' : 'Place Order'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
