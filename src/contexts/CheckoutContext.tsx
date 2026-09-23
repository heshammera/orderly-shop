"use client";

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { useCart } from '@/contexts/CartContext';
import { validateCheckout, focusCheckoutError, CheckoutErrors } from '@/lib/checkout-validation';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { governorates } from '@/lib/governorates';
import { useRouter } from 'next/navigation';
import { trackInitiateCheckout, trackPurchase } from '@/lib/pixelTracker';

interface CheckoutContextType {
    fieldErrors: CheckoutErrors;
    // State
    formData: any;
    setFormData: (data: any) => void;
    selectedGovernorate: string;
    setSelectedGovernorate: (id: string) => void;
    couponCode: string;
    setCouponCode: (code: string) => void;

    // Multi-step & Payment
    currentStep: number;
    setCurrentStep: (step: number) => void;
    paymentMethod: string;
    setPaymentMethod: (method: string) => void;

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

    const [fieldErrors, setFieldErrors] = useState<CheckoutErrors>({});
    const [validationStarted, setValidationStarted] = useState(false);
    const requestKey = useRef<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        alt_phone: '',
        email: '',
        address: '',
        city: '',
        notes: ''
    });
    const [selectedGovernorate, setSelectedGovernorate] = useState<string>('');

    // Multi-step & Payment State
    const [currentStep, setCurrentStep] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('cod');

    // Load saved form data from local storage
    useEffect(() => {
        if (!isEditable && typeof window !== 'undefined') {
            const savedData = localStorage.getItem(`checkout_data_${store?.id}`);
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    if (parsed.formData) setFormData(prev => ({ ...prev, ...parsed.formData }));
                    if (parsed.selectedGovernorate) setSelectedGovernorate(parsed.selectedGovernorate);
                } catch (e) { }
            }
        }
    }, [store?.id]);

    // Save form data to local storage when it changes
    useEffect(() => {
        if (!isEditable && typeof window !== 'undefined' && store?.id) {
            localStorage.setItem(`checkout_data_${store.id}`, JSON.stringify({
                formData,
                selectedGovernorate
            }));
        }
    }, [formData, selectedGovernorate, store?.id]);

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

    useEffect(() => {
        if (validationStarted) {
            const errors = validateCheckout(formData, shippingSettings, selectedGovernorate, language).errors;
            document.querySelectorAll<HTMLInputElement>('#checkout-form [required]').forEach(input => {
                if (!String(input.value).trim() && !errors[input.id]) {
                    const label = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(input.id)}"]`)?.textContent || input.id;
                    errors[input.id] = language === 'ar' ? `${label}: هذا الحقل مطلوب؛ يرجى تعبئته.` : `${label}: this field is required.`;
                }
            });
            setFieldErrors(errors);
        }
    }, [formData, selectedGovernorate, language, validationStarted]);

    const total = Math.max(0, subtotal - discount - pointsDiscount + shippingCost + bumpOfferTotal);

    // Effects
    useEffect(() => {
        const isPreview = typeof window !== 'undefined' && window.location.search.includes('preview=true');
        if (!isPreview && !isEditable && cartCount === 0 && !success) {
            router.push(`${store.baseUrl ?? `/s/${store.slug}`}/products`);
        }
    }, [cartCount, success, store.slug, router, isEditable]);

    // Pixel: InitiateCheckout on mount
    useEffect(() => {
        if (isEditable || cart.length === 0) return;
        trackInitiateCheckout({
            content_ids: cart.map(item => item.productId),
            currency: store.currency,
            value: subtotal,
            num_items: cartCount,
        });
    }, []);

    // Verified loyalty redemption is enabled only after messaging setup.
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
            const response = await fetch('/api/checkout/coupon',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({store_id:store.id,code:couponCode,cart})});
            const result = await response.json();
            if(!response.ok)throw new Error(result.error);
            const data = result.coupon;
            const now = new Date();
            if (data.expires_at && new Date(data.expires_at) < now) throw new Error('Coupon expired');
            if (data.usage_limit && data.used_count >= data.usage_limit) throw new Error('Coupon usage limit reached');
            if (data.min_order_amount && subtotal < data.min_order_amount) throw new Error(`Minimum order amount is ${data.min_order_amount}`);

            // Customer usage is checked atomically on submission.
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
            let errorMsg = error.message;
            let arErrorMsg = 'الكوبون غير موجود أو غير فعال';

            if (error.message === 'Coupon expired') {
                arErrorMsg = 'الكوبون منتهي الصلاحية';
            } else if (error.message === 'Coupon usage limit reached') {
                arErrorMsg = 'نفذت كمية هذا الكوبون';
            } else if (error.message.includes('Minimum order')) {
                arErrorMsg = `الحد الأدنى للطلب هو ${error.message.split('is ')[1]}`;
            } else if (error.message === 'Coupon max usage per customer reached') {
                errorMsg = 'You have reached the maximum usage limit for this coupon';
                arErrorMsg = 'لقد استنفدت الحد الأقصى لاستخدام هذا الكوبون';
            }

            toast({
                title: language === 'ar' ? 'كوبون غير صالح' : 'Invalid Coupon',
                description: language === 'ar' ? arErrorMsg : errorMsg,
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

        const checked = validateCheckout(formData, shippingSettings, selectedGovernorate, language);
        document.querySelectorAll<HTMLInputElement>('#checkout-form [required]').forEach(input => {
            if (!String(input.value).trim() && !checked.errors[input.id]) {
                const label = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(input.id)}"]`)?.textContent || input.id;
                checked.errors[input.id] = language === 'ar' ? `${label}: هذا الحقل مطلوب؛ يرجى تعبئته.` : `${label}: this field is required.`;
            }
        });
        setValidationStarted(true);
        setFieldErrors(checked.errors);
        if (Object.keys(checked.errors).length) {
            focusCheckoutError(checked.errors, '');
            return;
        }
        setFormData(checked.data);

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
                    request_key: requestKey.current ||= crypto.randomUUID(),
                    store_id: store.id,
                    cart: cart.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        productName: item.productName,
                        variants: item.variants,
                    })),
                    formData: { ...checked.data, city: cityOrGovName },
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
                    paymentMethod,
                    language,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                if (result.fieldErrors) { setFieldErrors(result.fieldErrors); focusCheckoutError(result.fieldErrors, ''); return; }
                throw new Error(result.error || 'Failed to place order');
            }

            // Pixel: Purchase
            trackPurchase({
                content_ids: cart.map(item => item.productId),
                currency: store.currency,
                value: result.total,
                num_items: cartCount,
                order_id: result.order_number,
            });

            await clearCart();
            setSuccess(true);
            router.replace(`${store.baseUrl ?? `/s/${store.slug}`}/checkout/success?orderId=${result.order_number}`);

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
            fieldErrors, formData, setFormData,
            selectedGovernorate, setSelectedGovernorate,
            couponCode, setCouponCode,
            subtotal, shippingCost, discount, total,
            customerPoints, redeemPoints, setRedeemPoints, pointsDiscount, pointsToRedeem,
            bumpOffer, setBumpOffer, formatPrice,
            currentStep, setCurrentStep, paymentMethod, setPaymentMethod,
            handleApplyCoupon, handlePlaceOrder, removeCoupon,
            loading, appliedCoupon, store
        }}>
            {children}
        </CheckoutContext.Provider>
    );
}
