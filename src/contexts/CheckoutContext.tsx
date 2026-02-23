"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { governorates } from '@/lib/governorates';
import { useRouter } from 'next/navigation';

interface CheckoutContextType {
    // State
    formData: any;
    setFormData: (data: any) => void;
    selectedGovernorate: string;
    setSelectedGovernorate: (id: string) => void;
    couponCode: string;
    setCouponCode: (code: string) => void;

    // Calculated Values
    subtotal: number;
    shippingCost: number;
    discount: number;
    total: number;

    // Loyalty
    customerPoints: number;
    redeemPoints: boolean;
    setRedeemPoints: (redeem: boolean) => void;
    pointsDiscount: number;
    pointsToRedeem: number;

    // Bump Offer
    bumpOffer: { price: number; selected: boolean; label: string } | null;
    setBumpOffer: (offer: { price: number; selected: boolean; label: string } | null) => void;
    formatPrice: (price: number) => string;

    // Actions
    handleApplyCoupon: () => Promise<void>;
    handlePlaceOrder: (e?: React.FormEvent) => Promise<void>;
    removeCoupon: () => void;

    // Meta
    loading: boolean;
    appliedCoupon: any;
    store: any;
}

const CheckoutContext = createContext<CheckoutContextType | null>(null);

export function useCheckout() {
    const context = useContext(CheckoutContext);
    if (!context) {
        throw new Error('useCheckout must be used within a CheckoutProvider');
    }
    return context;
}

interface CheckoutProviderProps {
    store: any;
    children: ReactNode;
    isEditable?: boolean;
}

export function CheckoutProvider({ store, children, isEditable = false }: CheckoutProviderProps) {
    const { language } = useLanguage();
    const { cart, cartCount, clearCart } = useCart();
    const { toast } = useToast();
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        alt_phone: '',
        address: '',
        city: '',
        notes: ''
    });
    const [selectedGovernorate, setSelectedGovernorate] = useState<string>('');

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

    // Loyalty State
    const [customerPoints, setCustomerPoints] = useState(0);
    const [redeemPoints, setRedeemPoints] = useState(false);

    // Bump Offer State
    const [bumpOffer, setBumpOffer] = useState<{ price: number; selected: boolean; label: string } | null>(null);

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

    // Loyalty Calculation
    const redemptionRate = store.settings?.loyalty_redemption_rate || 100;
    const maxPointsValue = customerPoints / redemptionRate;
    const pointsDiscount = redeemPoints ? Math.min(maxPointsValue, subtotal - discount) : 0;
    const pointsToRedeem = pointsDiscount * redemptionRate;

    const bumpOfferTotal = bumpOffer?.selected ? bumpOffer.price : 0;

    const total = Math.max(0, subtotal - discount - pointsDiscount + shippingCost + bumpOfferTotal);

    // Effects
    useEffect(() => {
        if (!isEditable && cartCount === 0 && !success) {
            router.push(`/s/${store.slug}/products`);
        }
    }, [cartCount, success, store.slug, router, isEditable]);

    // Fetch Points
    useEffect(() => {
        if (!store.settings?.loyalty_program_enabled || formData.phone.length < 10) return;

        const fetchPoints = async () => {
            const { data } = await supabase
                .from('customers')
                .select('loyalty_points')
                .eq('store_id', store.id)
                .eq('phone', formData.phone)
                .single();

            if (data) {
                setCustomerPoints(data.loyalty_points || 0);
            }
        };
        const timer = setTimeout(fetchPoints, 1000);
        return () => clearTimeout(timer);
    }, [formData.phone, store.id, store.settings]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: store.currency,
        }).format(price);
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setLoading(true);
        try {
            const { data: rawData, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('store_id', store.id)
                .eq('code', couponCode)
                .eq('is_active', true)
                .single();

            if (error || !rawData) throw new Error('Invalid coupon code');

            const data = rawData;
            const now = new Date();
            if (data.expires_at && new Date(data.expires_at) < now) throw new Error('Coupon expired');
            if (data.usage_limit && data.used_count >= data.usage_limit) throw new Error('Coupon usage limit reached');
            if (data.min_order_amount && subtotal < data.min_order_amount) throw new Error(`Minimum order amount is ${data.min_order_amount}`);

            let discountValue = 0;
            if (data.discount_type === 'percentage') {
                discountValue = (subtotal * data.discount_value) / 100;
            } else {
                discountValue = data.discount_value;
            }
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
                variant: 'destructive'
            });
            setAppliedCoupon(null);
            setDiscount(0);
        } finally {
            setLoading(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setDiscount(0);
        setCouponCode('');
    };

    const handlePlaceOrder = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!store?.id) return;

        if (shippingSettings.type === 'dynamic' && !selectedGovernorate) {
            toast({
                variant: "destructive",
                title: language === 'ar' ? 'تنبيه' : 'Alert',
                description: language === 'ar' ? 'يرجى اختيار المحافظة لحساب الشحن' : 'Please select a governorate to calculate shipping',
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

            // Call server-side API route (uses service_role to bypass RLS)
            const res = await fetch('/api/checkout/place-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    store_id: store.id,
                    cart: cart.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        productName: item.productName,
                        variants: item.variants,
                    })),
                    formData: {
                        name: formData.name,
                        phone: formData.phone,
                        alt_phone: formData.alt_phone,
                        address: formData.address,
                        city: formData.city,
                        notes: formData.notes,
                    },
                    selectedGovernorate,
                    cityOrGovName,
                    shippingCost,
                    subtotal,
                    total,
                    discount,
                    couponCode: appliedCoupon?.code || null,
                    currency: store.currency,
                    notes: formData.notes,
                    affiliate_code: document.cookie.split('; ').find(row => row.startsWith('affiliate_code='))?.split('=')[1] || null,
                    bumpOffer: bumpOffer ? { selected: bumpOffer.selected, price: bumpOffer.price, label: bumpOffer.label } : null,
                    redeemPoints,
                    pointsToRedeem,
                    language,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Failed to place order');
            }

            await clearCart();
            setSuccess(true);
            router.replace(`/s/${store.slug}/checkout/success?orderId=${result.order_number}`);

        } catch (error: any) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: language === 'ar' ? 'خطأ في الطلب' : 'Checkout Failed',
                description: error.message || 'Something went wrong',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <CheckoutContext.Provider value={{
            formData, setFormData,
            selectedGovernorate, setSelectedGovernorate,
            couponCode, setCouponCode,
            subtotal, shippingCost, discount, total,
            customerPoints, redeemPoints, setRedeemPoints, pointsDiscount, pointsToRedeem,
            bumpOffer, setBumpOffer, formatPrice,
            handleApplyCoupon, handlePlaceOrder, removeCoupon,
            loading, appliedCoupon, store
        }}>
            {children}
        </CheckoutContext.Provider>
    );
}
