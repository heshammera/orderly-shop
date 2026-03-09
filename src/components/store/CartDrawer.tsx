"use client";

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
    store: {
        id: string;
        currency: string;
        slug: string;
        baseUrl?: string;
    };
}

export function CartDrawer({ store }: CartDrawerProps) {
    const { language } = useLanguage();
    const {
        cart,
        cartCount,
        isCartOpen,
        closeCart,
        removeFromCart,
        updateQuantity,
    } = useCart();

    const isRTL = language === 'ar';

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: store.currency,
        }).format(price);
    };

    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    const getProductName = (item: typeof cart[0]) => {
        if (typeof item.productName === 'string') return item.productName;
        return item.productName[language] || item.productName.ar;
    };

    const getImageUrl = (imageVal: any) => {
        if (!imageVal) return '';
        if (typeof imageVal === 'string') {
            try {
                const parsed = JSON.parse(imageVal);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
            } catch (e) {
                return imageVal;
            }
        }
        if (Array.isArray(imageVal) && imageVal.length > 0) return imageVal[0];
        return String(imageVal);
    };

    return (
        <Sheet open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
            <SheetContent
                side={isRTL ? 'right' : 'right'}
                className="w-full sm:max-w-md flex flex-col p-0"
            >
                {/* Header */}
                <SheetHeader className="px-6 py-4 border-b bg-card flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2 text-lg">
                            <ShoppingBag className="w-5 h-5" />
                            {isRTL ? 'سلة التسوق' : 'Shopping Cart'}
                            {cartCount > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                    {cartCount}
                                </Badge>
                            )}
                        </SheetTitle>
                    </div>
                    <SheetDescription className="sr-only">
                        {isRTL ? 'محتويات سلة التسوق' : 'Shopping cart contents'}
                    </SheetDescription>
                </SheetHeader>

                {/* Cart Items - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    {cart.length === 0 ? (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center h-full py-16 px-6">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                                <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">
                                {isRTL ? 'السلة فارغة' : 'Your cart is empty'}
                            </h3>
                            <p className="text-muted-foreground text-sm text-center mb-6">
                                {isRTL
                                    ? 'ابدأ التسوق وأضف منتجات للسلة'
                                    : 'Start shopping and add products to your cart'}
                            </p>
                            <Link href={`products`} onClick={closeCart}>
                                <Button>
                                    {isRTL ? 'تصفح المنتجات' : 'Browse Products'}
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        /* Cart Items List */
                        <div className="divide-y">
                            {cart.map((item, index) => (
                                <div
                                    key={`${item.productId}-${index}`}
                                    className="px-6 py-4 hover:bg-muted/30 transition-colors group"
                                >
                                    <div className="flex gap-3">
                                        {/* Product Image */}
                                        <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0 border">
                                            {item.productImage && getImageUrl(item.productImage) ? (
                                                <img
                                                    src={getImageUrl(item.productImage)}
                                                    alt={getProductName(item)}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="text-lg font-bold text-primary/20">
                                                        {getProductName(item).charAt(0)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={`${item.productId}`}
                                                onClick={closeCart}
                                                className="hover:underline"
                                            >
                                                <h4 className="font-medium text-sm leading-tight line-clamp-2 hover:text-primary transition-colors">
                                                    {getProductName(item)}
                                                </h4>
                                            </Link>

                                            {/* Variants */}
                                            {item.variants.length > 0 && (
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {item.variants.map((v: any, i: number) => (
                                                        <span key={v.variantId}>
                                                            {typeof v.optionLabel === 'string'
                                                                ? v.optionLabel
                                                                : (v.optionLabel[language] || v.optionLabel.ar)}
                                                            {i < item.variants.length - 1 && ' • '}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Price & Quantity Controls */}
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() =>
                                                            updateQuantity(item.productId, item.variants, item.quantity - 1)
                                                        }
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </Button>
                                                    <span className="w-7 text-center text-sm font-medium">
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() =>
                                                            updateQuantity(item.productId, item.variants, item.quantity + 1)
                                                        }
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => removeFromCart(item.productId, item.variants)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>

                                                <span className="font-bold text-sm text-primary">
                                                    {formatPrice(item.unitPrice * item.quantity)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer - Fixed at bottom */}
                {cart.length > 0 && (
                    <div className="border-t bg-card px-6 py-4 flex-shrink-0 space-y-3">
                        {/* Subtotal */}
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">
                                {isRTL ? 'المجموع الفرعي' : 'Subtotal'}
                            </span>
                            <span className="font-bold text-lg text-primary">
                                {formatPrice(subtotal)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isRTL
                                ? 'الشحن والضرائب تحسب عند إتمام الطلب'
                                : 'Shipping & taxes calculated at checkout'}
                        </p>

                        <Separator />

                        {/* Checkout Button */}
                        <Link href={`checkout`} onClick={closeCart} className="block">
                            <Button size="lg" className="w-full gap-2 text-base">
                                {isRTL ? 'إتمام الطلب' : 'Checkout'}
                                <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                            </Button>
                        </Link>

                        {/* Continue Shopping */}
                        <Button
                            variant="ghost"
                            className="w-full text-sm"
                            onClick={closeCart}
                        >
                            {isRTL ? 'متابعة التسوق' : 'Continue Shopping'}
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
