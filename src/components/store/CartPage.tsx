"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';

interface CartPageProps {
    store: {
        id: string;
        currency: string;
        slug: string;
    };
}

export function CartPage({ store }: CartPageProps) {
    const { language } = useLanguage();
    const { cart, removeFromCart, updateQuantity, cartCount } = useCart();
    const router = useRouter();

    const ArrowBack = language === 'ar' ? ArrowRight : ArrowLeft;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: store.currency,
        }).format(price);
    };

    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    if (cart.length === 0) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">
                    {language === 'ar' ? 'السلة فارغة' : 'Your cart is empty'}
                </h1>
                <p className="text-muted-foreground mb-6">
                    {language === 'ar'
                        ? 'ابدأ التسوق وأضف منتجات للسلة'
                        : 'Start shopping and add products to your cart'}
                </p>
                <Link href={`/s/${store.slug}/products`}>
                    <Button>{language === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowBack className="w-5 h-5" />
                </Button>
                <h1 className="text-2xl font-bold">
                    {language === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
                </h1>
                <span className="text-muted-foreground">
                    ({cartCount} {language === 'ar' ? 'منتج' : 'items'})
                </span>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.map((item, index) => (
                        <Card key={`${item.productId}-${index}`}>
                            <CardContent className="p-4">
                                <div className="flex gap-4">
                                    {/* Image */}
                                    <div className="w-24 h-24 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                                        {item.productImage ? (
                                            <img
                                                src={item.productImage}
                                                alt={typeof item.productName === 'string' ? item.productName : (item.productName[language] || item.productName.ar)}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-2xl font-bold text-primary/20">
                                                    {(typeof item.productName === 'string' ? item.productName : (item.productName[language] || item.productName.ar)).charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/s/${store.slug}/p/${item.productId}`} className="hover:underline">
                                            <h3 className="font-medium hover:text-primary transition-colors">
                                                {typeof item.productName === 'string' ? item.productName : (item.productName[language] || item.productName.ar)}
                                            </h3>
                                        </Link>

                                        {/* Variants */}
                                        {item.variants.length > 0 && (
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {item.variants.map((v, i) => (
                                                    <span key={v.variantId}>
                                                        {typeof v.variantName === 'string' ? v.variantName : (v.variantName[language] || v.variantName.ar)}: {typeof v.optionLabel === 'string' ? v.optionLabel : (v.optionLabel[language] || v.optionLabel.ar)}
                                                        {i < item.variants.length - 1 && ' • '}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mt-3">
                                            {/* Quantity */}
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => updateQuantity(item.productId, item.variants, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </Button>
                                                <span className="w-8 text-center">{item.quantity}</span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => updateQuantity(item.productId, item.variants, item.quantity + 1)}
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => removeFromCart(item.productId, item.variants)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            {/* Price */}
                                            <span className="font-bold text-primary">
                                                {formatPrice(item.unitPrice * item.quantity)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardContent className="p-6">
                            <h2 className="text-lg font-bold mb-4">
                                {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                            </h2>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        {language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}
                                    </span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        {language === 'ar' ? 'الشحن' : 'Shipping'}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {language === 'ar' ? 'يحسب عند الدفع' : 'Calculated at checkout'}
                                    </span>
                                </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="flex justify-between text-lg font-bold mb-6">
                                <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                                <span className="text-primary">{formatPrice(subtotal)}</span>
                            </div>

                            <Link href={`/s/${store.slug}/checkout`}>
                                <Button size="lg" className="w-full">
                                    {language === 'ar' ? 'إتمام الطلب' : 'Proceed to Checkout'}
                                </Button>
                            </Link>

                            <Link href={`/s/${store.slug}/products`}>
                                <Button variant="ghost" className="w-full mt-2">
                                    {language === 'ar' ? 'متابعة التسوق' : 'Continue Shopping'}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
