"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, Package, ArrowRight, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';

interface CheckoutSuccessClientProps {
    store: any; // Add baseUrl here implicitly
    order: any;
}

export function CheckoutSuccessClient({ store, order }: CheckoutSuccessClientProps) {
    const { language } = useLanguage();
    const isRTL = language === 'ar';
    const Arrow = isRTL ? ArrowLeft : ArrowRight;

    const storeName = store.name?.[language] || store.name?.ar || store.name?.en || 'Store';

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: store.currency || 'SAR',
        }).format(price);
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="max-w-md w-full text-center space-y-6">
                {/* Success Icon */}
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">
                        {isRTL ? 'تم تأكيد طلبك بنجاح!' : 'Order Confirmed!'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isRTL
                            ? 'شكراً لك! تم استلام طلبك وسنتواصل معك قريباً.'
                            : 'Thank you! Your order has been received and we\'ll contact you soon.'}
                    </p>
                </div>

                {/* Order Details */}
                {order && (
                    <div className="bg-card border rounded-xl p-5 text-start space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Package className="w-4 h-4" />
                            {isRTL ? 'تفاصيل الطلب' : 'Order Details'}
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{isRTL ? 'رقم الطلب' : 'Order Number'}</span>
                                <span className="font-mono font-semibold">{order.order_number}</span>
                            </div>

                            {order.customer_snapshot?.name && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{isRTL ? 'الاسم' : 'Name'}</span>
                                    <span>{order.customer_snapshot.name}</span>
                                </div>
                            )}

                            {order.customer_snapshot?.phone && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{isRTL ? 'الهاتف' : 'Phone'}</span>
                                    <span dir="ltr">{order.customer_snapshot.phone}</span>
                                </div>
                            )}

                            <div className="border-t my-2" />

                            {order.subtotal != null && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
                                    <span>{formatPrice(order.subtotal)}</span>
                                </div>
                            )}

                            {order.shipping_cost > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{isRTL ? 'الشحن' : 'Shipping'}</span>
                                    <span>{formatPrice(order.shipping_cost)}</span>
                                </div>
                            )}

                            {order.discount_amount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>{isRTL ? 'الخصم' : 'Discount'}</span>
                                    <span>-{formatPrice(order.discount_amount)}</span>
                                </div>
                            )}

                            <div className="flex justify-between font-bold text-base border-t pt-2">
                                <span>{isRTL ? 'الإجمالي' : 'Total'}</span>
                                <span>{formatPrice(order.total)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-2">
                    <Link
                        href={`${store.baseUrl ?? `/s/${store.slug}`}/products`}
                        className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3 font-medium transition-colors"
                    >
                        {isRTL ? 'تصفح المزيد من المنتجات' : 'Browse More Products'}
                        <Arrow className="w-4 h-4" />
                    </Link>

                    <Link
                        href={store.baseUrl || '/'}
                        className="inline-flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                        <Home className="w-4 h-4" />
                        {isRTL ? 'العودة للرئيسية' : 'Back to Home'}
                    </Link>
                </div>
            </div>
        </div>
    );
}
