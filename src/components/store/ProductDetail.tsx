"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingCart, ChevronLeft, ChevronRight, Zap, Check, Loader2, Truck } from 'lucide-react';
import { QuickOrderForm } from '@/components/store/QuickOrderForm';
import { cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { trackViewContent, trackAddToCart } from '@/lib/pixelTracker';

// Define types here or import shared types
type DiscountType = 'fixed' | 'percentage';

interface Product {
    id: string;
    name: { ar: string; en: string };
    description: { ar: string; en: string };
    price: number;
    compare_at_price: number | null;
    images: string[];
    stock_quantity: number;
    track_inventory: boolean;
    skip_cart?: boolean;
    free_shipping?: boolean;
    fake_countdown_enabled?: boolean;
    fake_countdown_minutes?: number;
    fake_visitors_enabled?: boolean;
    fake_visitors_min?: number;
    fake_visitors_max?: number;
    ignore_stock?: boolean;
}

interface Variant {
    id: string;
    name: { ar: string; en: string };
    display_type: 'buttons' | 'list' | 'dropdown' | 'color' | 'image';
    option_type: 'text' | 'color' | 'image';
    required: boolean;
    options: VariantOption[];
}

interface VariantOption {
    id: string;
    label: { ar: string; en: string };
    value: string;
    price_modifier: number | null;
    price?: number | null;
    stock?: number | null;
    manage_stock?: boolean;
    is_default: boolean;
    in_stock?: boolean;
}

interface UpsellOffer {
    id: string;
    min_quantity: number;
    discount_type: DiscountType;
    discount_value: number;
    label: { ar: string; en: string };
    badge: { ar: string; en: string };
}

interface StoreData {
    id: string;
    currency: string;
    settings: any;
    slug: string;
}

interface ProductDetailProps {
    product: Product;
    variants: Variant[];
    upsellOffers: UpsellOffer[];
    store: StoreData;
}

function FakeCountdown({ minutes, language }: { minutes: number; language: string }) {
    const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null);

    useEffect(() => {
        const storageKey = `countdown_end_product`; // Could be specific to productId if needed
        let endTimeStr = localStorage.getItem(storageKey);
        let endTime: number;

        if (!endTimeStr) {
            endTime = Date.now() + minutes * 60 * 1000;
            localStorage.setItem(storageKey, endTime.toString());
        } else {
            endTime = parseInt(endTimeStr);
            // If already expired, reset it to make it look active (for fake effect)
            if (endTime < Date.now()) {
                endTime = Date.now() + minutes * 60 * 1000;
                localStorage.setItem(storageKey, endTime.toString());
            }
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = endTime - now;

            if (diff <= 0) {
                // Keep it at 0:0:1 or reset
                setTimeLeft({ h: 0, m: 0, s: 1 });
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft({ h, m, s });
        }, 1000);

        return () => clearInterval(interval);
    }, [minutes]);

    if (!timeLeft) return null;

    return (
        <div className="flex flex-col items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl my-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
                <Zap className="w-4 h-4 animate-pulse" />
                <span>{language === 'ar' ? 'ينتهي العرض قريباً!' : 'Offer ends soon!'}</span>
            </div>
            <div className="flex gap-4">
                {[
                    { label: language === 'ar' ? 'ثانية' : 'Sec', val: timeLeft.s },
                    { label: language === 'ar' ? 'دقيقة' : 'Min', val: timeLeft.m },
                    { label: language === 'ar' ? 'ساعة' : 'Hrs', val: timeLeft.h },
                ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-red-600 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-inner">
                            {item.val.toString().padStart(2, '0')}
                        </div>
                        <span className="text-[10px] text-red-800 dark:text-red-300 mt-1 uppercase font-semibold">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FakeVisitors({ min, max, language }: { min: number; max: number; language: string }) {
    const [visitors, setVisitors] = useState(0);

    useEffect(() => {
        // Random starting number
        const start = Math.floor(Math.random() * (max - min) + min);
        setVisitors(start);

        // Fluctuate slightly every 5-10 seconds
        const interval = setInterval(() => {
            setVisitors(prev => {
                const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
                const newVal = prev + change;
                if (newVal < min) return min;
                if (newVal > max) return max;
                return newVal;
            });
        }, 8000);

        return () => clearInterval(interval);
    }, [min, max]);

    return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground my-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </div>
            <span>
                {language === 'ar'
                    ? `يوجد الآن ${visitors} أشخاص يشاهدون هذا المنتج`
                    : `There are ${visitors} people viewing this product right now`}
            </span>
        </div>
    );
}

export function ProductDetail({ product, variants, upsellOffers, store }: ProductDetailProps) {
    const { language } = useLanguage();
    const { toast } = useToast();
    const { addToCart } = useCart();

    // State
    const [quantity, setQuantity] = useState(1);
    // Selections: ItemIndex -> VariantID -> OptionID
    const [selections, setSelections] = useState<Record<number, Record<string, string>>>({});
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [addingToCart, setAddingToCart] = useState(false);
    const [quickOrderOpen, setQuickOrderOpen] = useState(false);

    // Pixel: ViewContent on mount
    useEffect(() => {
        const productName = product.name[language] || product.name.ar;
        trackViewContent({
            content_id: product.id,
            content_name: productName,
            content_type: 'product',
            currency: store.currency,
            value: product.price,
        });
    }, [product.id]);

    const ChevronPrev = language === 'ar' ? ChevronRight : ChevronLeft;
    const ChevronNext = language === 'ar' ? ChevronLeft : ChevronRight;

    // Adjust selections when quantity changes
    useEffect(() => {
        setSelections(prev => {
            const newSelections: Record<number, Record<string, string>> = {};

            // Keep existing selections for indices that still valid
            for (let i = 0; i < quantity; i++) {
                if (prev[i]) {
                    newSelections[i] = prev[i];
                } else {
                    // Initialize defaults for new items
                    const defaults: Record<string, string> = {};
                    variants.forEach(v => {
                        const defaultOption = v.options.find(o => o.is_default) || v.options[0];
                        if (defaultOption) {
                            defaults[v.id] = defaultOption.id;
                        }
                    });
                    newSelections[i] = defaults;
                }
            }
            return newSelections;
        });
    }, [quantity, variants]);

    const getApplicableOffer = () => {
        return upsellOffers
            .filter(o => quantity >= o.min_quantity)
            .sort((a, b) => b.min_quantity - a.min_quantity)[0];
    };

    const calculateTotalPrice = () => {
        if (!product) return 0;

        // Calculate base price + modifiers for each item
        let total = 0;

        for (let i = 0; i < quantity; i++) {
            let itemPrice = product.price;
            const itemSelections = selections[i] || {};

            Object.entries(itemSelections).forEach(([variantId, optionId]) => {
                const variant = variants.find(v => v.id === variantId);
                const option = variant?.options.find(o => o.id === optionId);

                if (option?.price !== undefined && option.price !== null) {
                    itemPrice = option.price;
                } else if (option?.price_modifier) {
                    itemPrice += option.price_modifier;
                }
            });
            total += itemPrice;
        }

        // Apply offer discount (per item)
        const offer = getApplicableOffer();
        if (offer) {
            if (offer.discount_type === 'percentage') {
                total = total * (1 - offer.discount_value / 100);
            } else {
                // Fixed discount is per item, so multiply by quantity
                total = Math.max(0, total - (offer.discount_value * quantity));
            }
        }

        return total;
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: store.currency,
        }).format(price);
    };

    const handleOptionSelect = (itemIndex: number, variantId: string, optionId: string) => {
        setSelections(prev => ({
            ...prev,
            [itemIndex]: {
                ...prev[itemIndex],
                [variantId]: optionId
            }
        }));
    };

    const handleQuickOrder = () => {
        // Validation
        const missingVariants = variants.filter(v => v.required && !selections[0]?.[v.id]);
        if (missingVariants.length > 0) {
            toast({
                title: language === 'ar' ? 'خيارات مفقودة' : 'Missing Options',
                description: language === 'ar'
                    ? `يرجى اختيار ${missingVariants[0].name[language] || missingVariants[0].name.ar}`
                    : `Please select ${missingVariants[0].name[language] || missingVariants[0].name.en}`,
                variant: "destructive"
            });
            return;
        }
        setQuickOrderOpen(true);
    };

    const handleAddToCart = async () => {
        if (!product) return;

        // Validation: Check if all required variants are selected for all items
        for (let i = 0; i < quantity; i++) {
            const itemSelections = selections[i] || {};
            const missingVariants = variants.filter(v => v.required && !itemSelections[v.id]);

            if (missingVariants.length > 0) {
                toast({
                    title: language === 'ar' ? 'خيارات مفقودة' : 'Missing Options',
                    description: language === 'ar'
                        ? `يرجى اختيار ${missingVariants[0].name[language] || missingVariants[0].name.ar} للقطعة رقم ${i + 1}`
                        : `Please select ${missingVariants[0].name[language] || missingVariants[0].name.en} for item ${i + 1}`,
                    variant: "destructive"
                });
                return;
            }
        }

        setAddingToCart(true);

        try {
            const total = calculateTotalPrice();
            const effectiveUnitPrice = total / quantity;

            // Group identical items before adding
            const addedItems: Record<string, any> = {};

            for (let i = 0; i < quantity; i++) {
                const itemSelections = selections[i] || {};
                const selectedVariants = Object.entries(itemSelections).map(([variantId, optionId]) => {
                    const variant = variants.find(v => v.id === variantId);
                    const option = variant?.options.find(o => o.id === optionId);
                    return {
                        variantId,
                        variantName: variant?.name,
                        optionId,
                        optionLabel: variant?.options.find(o => o.id === optionId)?.label,
                        priceModifier: option?.price_modifier || 0,
                        price: option?.price || null,
                        stock: option?.stock || null,
                        manage_stock: option?.manage_stock || false,
                    };
                });

                const variantKey = JSON.stringify(selectedVariants);
                if (addedItems[variantKey]) {
                    addedItems[variantKey].quantity += 1;
                } else {
                    addedItems[variantKey] = {
                        productId: product.id,
                        productName: product.name,
                        productImage: product.images[0] || null,
                        basePrice: product.price,
                        unitPrice: effectiveUnitPrice,
                        quantity: 1,
                        variants: selectedVariants,
                        addedAt: new Date().toISOString(),
                    };
                }
            }

            for (const item of Object.values(addedItems)) {
                await addToCart(item);
            }

            // Pixel: AddToCart
            const pName = product.name[language] || product.name.ar;
            trackAddToCart({
                content_id: product.id,
                content_name: pName,
                content_type: 'product',
                currency: store.currency,
                value: total,
                quantity,
            });

            toast({
                title: language === 'ar' ? 'تمت الإضافة للسلة' : 'Added to cart',
            });
        } catch (error) {
            console.error('Error adding to cart', error);
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: language === 'ar' ? 'حدث خطأ أثناء الإضافة للسلة' : 'Failed to add to cart',
                variant: 'destructive'
            });
        } finally {
            setAddingToCart(false);
        }
    };

    const productName = product.name[language] || product.name.ar;
    const totalPrice = calculateTotalPrice();
    const applicableOffer = getApplicableOffer();

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-6 pb-32 md:py-8 md:pb-8 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 w-full min-w-0">
                {/* Image Gallery */}
                <div className="space-y-4 w-full min-w-0">
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
                        {product.images.length > 0 ? (
                            <>
                                <img
                                    src={product.images[currentImageIndex]}
                                    alt={productName}
                                    className="w-full h-full object-cover"
                                />
                                {product.images.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setCurrentImageIndex(i => i === 0 ? product.images.length - 1 : i - 1)}
                                            className="absolute start-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                                        >
                                            <ChevronPrev className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentImageIndex(i => i === product.images.length - 1 ? 0 : i + 1)}
                                            className="absolute end-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                                        >
                                            <ChevronNext className="w-5 h-5" />
                                        </button>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-6xl font-bold text-primary/20">{productName.charAt(0)}</span>
                            </div>
                        )}
                        {product.compare_at_price && product.compare_at_price > product.price && (
                            <Badge className="absolute top-4 start-4 bg-destructive">
                                {language === 'ar' ? 'تخفيض' : 'Sale'}
                            </Badge>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {product.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {product.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentImageIndex(idx)}
                                    className={cn(
                                        "w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors",
                                        currentImageIndex === idx ? "border-primary" : "border-transparent"
                                    )}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-8 min-w-0">
                    <div className="min-w-0">
                        {product.free_shipping && (
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold text-xs uppercase mb-1 tracking-wider">
                                <Truck className="w-4 h-4" />
                                {language === 'ar' ? 'شحن مجاني' : 'Free Shipping'}
                            </div>
                        )}
                        <h1 className="text-2xl md:text-3xl font-bold mb-2 break-words">{productName}</h1>

                        {product.fake_visitors_enabled && (
                            <FakeVisitors
                                min={product.fake_visitors_min || 10}
                                max={product.fake_visitors_max || 50}
                                language={language}
                            />
                        )}

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-bold text-primary">
                                    {formatPrice(calculateTotalPrice())}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {(() => {
                                        const shipping = store.settings?.shipping;
                                        if (shipping?.type === 'fixed') {
                                            const cost = Number(shipping.fixed_price) || 0;
                                            if (cost === 0) return language === 'ar' ? '+ شحن مجاني' : '+ Free Shipping';
                                            return language === 'ar'
                                                ? `+ ${formatPrice(cost)} شحن`
                                                : `+ ${formatPrice(cost)} Shipping`;
                                        } else {
                                            return language === 'ar' ? '+ مصاريف الشحن' : '+ Shipping Costs';
                                        }
                                    })()}
                                </p>
                            </div>
                            {quantity > 1 && (
                                <span className="text-sm text-muted-foreground">
                                    ({formatPrice(totalPrice / quantity)} / {language === 'ar' ? 'للقطعة' : 'per item'})
                                </span>
                            )}
                        </div>

                        {product.fake_countdown_enabled && (
                            <FakeCountdown
                                minutes={product.fake_countdown_minutes || 60}
                                language={language}
                            />
                        )}
                    </div>

                    {/* Quantity Selector - Always Visible Above Offers */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">
                            {language === 'ar' ? 'الكمية الإجمالية' : 'Total Quantity'}
                        </Label>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center border-2 border-border/60 rounded-xl overflow-hidden bg-card">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-12 h-12 flex items-center justify-center bg-muted/30 hover:bg-muted transition-colors border-e-2 border-border/60 disabled:opacity-50"
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <div className="w-16 h-12 flex items-center justify-center font-bold text-lg">
                                    {quantity}
                                </div>
                                <button
                                    onClick={() => setQuantity(Math.min(product.stock_quantity || 100, quantity + 1))}
                                    className="w-12 h-12 flex items-center justify-center bg-muted/30 hover:bg-muted transition-colors border-s-2 border-border/60 disabled:opacity-50"
                                    disabled={quantity >= (product.stock_quantity || 100)}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Upsell Offers - Premium Design */}
                    {upsellOffers.length > 0 && (
                        <div className="space-y-2.5">
                            <RadioGroup
                                value={quantity.toString()}
                                onValueChange={(val) => setQuantity(parseInt(val))}
                                className="grid gap-2.5"
                            >
                                <div
                                    className={cn(
                                        "relative flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 gap-2",
                                        quantity === 1
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-border/60 hover:border-primary/40 bg-card"
                                    )}
                                    onClick={() => setQuantity(1)}
                                >
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="1" id="q-1" className="flex-shrink-0" />
                                        <Label htmlFor="q-1" className="cursor-pointer font-medium text-sm">
                                            {language === 'ar' ? 'قطعة واحدة' : '1 Item'}
                                        </Label>
                                    </div>
                                    <span className="font-bold text-sm">{formatPrice(product.price)}</span>
                                </div>

                                {/* Offers */}
                                {upsellOffers.map((offer, idx) => {
                                    const isSelected = quantity === offer.min_quantity;
                                    const badge = offer.badge[language] || offer.badge.ar;
                                    const label = offer.label[language] || offer.label.ar;


                                    // Calculate prices for display (fixed discount is per item)
                                    const originalTotal = product.price * offer.min_quantity;
                                    let discountedTotal = originalTotal;
                                    if (offer.discount_type === 'percentage') {
                                        discountedTotal = originalTotal * (1 - offer.discount_value / 100);
                                    } else {
                                        // Fixed discount × quantity
                                        discountedTotal = Math.max(0, originalTotal - (offer.discount_value * offer.min_quantity));
                                    }
                                    const savedAmount = originalTotal - discountedTotal;
                                    const perItem = discountedTotal / offer.min_quantity;

                                    return (
                                        <div
                                            key={offer.id}
                                            className={cn(
                                                "relative rounded-xl border-2 cursor-pointer transition-all duration-200 overflow-hidden",
                                                isSelected
                                                    ? "border-primary shadow-md shadow-primary/10"
                                                    : badge
                                                        ? "border-primary/50 hover:border-primary ring-1 ring-primary/20"
                                                        : "border-border/60 hover:border-primary/40"
                                            )}
                                            onClick={() => setQuantity(offer.min_quantity)}
                                        >
                                            {/* Recommended / Badge ribbon */}
                                            {badge && (
                                                <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[11px] font-bold px-3 py-1 text-center tracking-wide">
                                                    {badge}
                                                </div>
                                            )}

                                            <div className={cn(
                                                "p-3 space-y-2",
                                                isSelected && "bg-primary/5"
                                            )}>
                                                {/* Row 1: Radio + Label */}
                                                <div className="flex items-center gap-2">
                                                    <RadioGroupItem
                                                        value={offer.min_quantity.toString()}
                                                        id={`q-${offer.min_quantity}`}
                                                        className="flex-shrink-0"
                                                    />
                                                    <Label htmlFor={`q-${offer.min_quantity}`} className="cursor-pointer font-semibold text-sm flex-1">
                                                        {label || `${language === 'ar' ? 'اشتري' : 'Buy'} ${offer.min_quantity}`}
                                                    </Label>
                                                </div>
                                                {/* Row 2: Prices */}
                                                <div className="flex items-center justify-between ps-6">
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {formatPrice(perItem)} / {language === 'ar' ? 'للقطعة' : 'each'}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                                        <span className="text-xs text-muted-foreground line-through">
                                                            {formatPrice(originalTotal)}
                                                        </span>
                                                        <span className="font-bold text-sm">
                                                            {formatPrice(discountedTotal)}
                                                        </span>
                                                        <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                                            {language === 'ar' ? 'وفّر ' : '-'}
                                                            {offer.discount_type === 'percentage'
                                                                ? `${offer.discount_value}%`
                                                                : formatPrice(savedAmount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                            </RadioGroup>
                        </div>
                    )}

                    {/* Variants Selection - Per Item */}
                    <div className="space-y-6">
                        {Array.from({ length: quantity }).map((_, itemIndex) => (
                            <div key={itemIndex} className="p-4 border rounded-lg bg-card/50">
                                <h3 className="font-medium mb-4 flex items-center gap-2">
                                    <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                        {itemIndex + 1}
                                    </span>
                                    {language === 'ar' ? `القطعة ${itemIndex + 1}` : `Item ${itemIndex + 1}`}
                                </h3>

                                <div className="space-y-4">
                                    {variants.map((variant) => {
                                        const selectedOptionId = selections[itemIndex]?.[variant.id];
                                        const selectedOption = variant.options.find(o => o.id === selectedOptionId);
                                        const selectedLabel = selectedOption ? (selectedOption.label[language] || selectedOption.label.ar) : '';

                                        return (
                                            <div key={variant.id} className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm font-medium text-foreground">
                                                        {variant.name[language] || variant.name.ar}
                                                        {selectedLabel && (
                                                            <span className="text-muted-foreground ms-2 font-normal">
                                                                : {selectedLabel}
                                                            </span>
                                                        )}
                                                    </label>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {variant.options.map((option) => {
                                                        const isSelected = selections[itemIndex]?.[variant.id] === option.id;

                                                        if (variant.display_type === 'color' || variant.option_type === 'color') {
                                                            return (
                                                                <button
                                                                    key={option.id}
                                                                    onClick={() => (product.ignore_stock || option.in_stock !== false) && handleOptionSelect(itemIndex, variant.id, option.id)}
                                                                    disabled={!product.ignore_stock && option.in_stock === false}
                                                                    className={cn(
                                                                        "w-12 h-12 rounded-full border-2 transition-all relative flex items-center justify-center disabled:cursor-not-allowed",
                                                                        isSelected ? "border-primary ring-2 ring-primary/20 scale-110" : "border-transparent ring-1 ring-border hover:scale-105",
                                                                        (!product.ignore_stock && option.in_stock === false) && "opacity-40 grayscale"
                                                                    )}
                                                                    style={{ backgroundColor: option.value }}
                                                                    title={option.label[language] || option.label.ar}
                                                                >
                                                                    {isSelected && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                                                                    {(!product.ignore_stock && option.in_stock === false) && (
                                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                                            <div className="w-full h-[2px] bg-red-500/80 rotate-45 transform" />
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            );
                                                        }

                                                        if (variant.display_type === 'image' || variant.option_type === 'image') {
                                                            return (
                                                                <button
                                                                    key={option.id}
                                                                    onClick={() => (product.ignore_stock || option.in_stock !== false) && handleOptionSelect(itemIndex, variant.id, option.id)}
                                                                    disabled={!product.ignore_stock && option.in_stock === false}
                                                                    className={cn(
                                                                        "w-16 h-16 rounded-md border-2 overflow-hidden relative transition-all disabled:cursor-not-allowed",
                                                                        isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent ring-1 ring-border opacity-80 hover:opacity-100",
                                                                        (!product.ignore_stock && option.in_stock === false) && "opacity-40 grayscale"
                                                                    )}
                                                                    title={option.label[language] || option.label.ar}
                                                                >
                                                                    {option.value ? (
                                                                        <img src={option.value} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-muted">
                                                                            <span className="text-[10px] text-muted-foreground p-1 text-center">{option.label[language] || option.label.ar}</span>
                                                                        </div>
                                                                    )}
                                                                    {isSelected && (
                                                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                                            <Check className="w-6 h-6 text-white" />
                                                                        </div>
                                                                    )}
                                                                    {(!product.ignore_stock && option.in_stock === false) && (
                                                                        <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
                                                                            <span className="text-[10px] font-bold text-destructive bg-white/90 px-1 py-0.5 rounded shadow-sm border border-destructive/20 whitespace-nowrap">
                                                                                {language === 'ar' ? 'نفد' : 'Out'}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            );
                                                        }

                                                        return (
                                                            <button
                                                                key={option.id}
                                                                onClick={() => (product.ignore_stock || option.in_stock !== false) && handleOptionSelect(itemIndex, variant.id, option.id)}
                                                                disabled={!product.ignore_stock && option.in_stock === false}
                                                                className={cn(
                                                                    "px-4 py-2 rounded-md border text-sm transition-all min-w-[3rem] disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:line-through",
                                                                    isSelected
                                                                        ? "border-primary bg-primary/10 text-primary font-medium"
                                                                        : "border-border hover:border-primary/50 text-muted-foreground bg-card"
                                                                )}
                                                            >
                                                                {option.label[language] || option.label.ar}
                                                                {(!product.ignore_stock && option.in_stock === false) && (
                                                                    <span className="ms-1 text-xs opacity-70">
                                                                        ({language === 'ar' ? 'نفد' : 'Out'})
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add to Cart */}
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-medium">{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                            <div className="text-end">
                                <div className="text-2xl font-bold">{formatPrice(totalPrice)}</div>
                                {applicableOffer && (
                                    <div className="text-sm text-green-600">
                                        {language === 'ar' ? 'يشمل الخصم' : 'Includes discount'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            {!product.skip_cart && (
                                <Button
                                    size="lg"
                                    className="flex-1 h-14 md:h-11 rounded-xl md:rounded-md text-base md:text-sm font-semibold md:font-medium shadow-md md:shadow-none"
                                    onClick={handleAddToCart}
                                    disabled={addingToCart || (!product.ignore_stock && product.stock_quantity === 0)}
                                >
                                    {addingToCart ? (
                                        <Loader2 className="w-5 h-5 md:w-4 md:h-4 animate-spin" />
                                    ) : (
                                        <ShoppingCart className="w-5 h-5 md:w-4 md:h-4 me-2" />
                                    )}
                                    {(!product.ignore_stock && product.stock_quantity === 0)
                                        ? (language === 'ar' ? 'نفذت الكمية' : 'Out of Stock')
                                        : (language === 'ar' ? 'إضافة للسلة' : 'Add to Cart')
                                    }
                                </Button>
                            )}

                            <Button
                                size="lg"
                                variant={product.skip_cart ? "default" : "outline"}
                                className={cn(
                                    "w-full rounded-xl md:rounded-md text-base md:text-sm font-bold shadow-md md:shadow-none transition-all duration-200 active:scale-95",
                                    product.skip_cart ? "h-16 md:h-14 text-lg md:text-base bg-emerald-600 hover:bg-emerald-700 text-white" : "h-14 md:h-11 border-primary text-primary hover:bg-primary/10 bg-background"
                                )}
                                onClick={handleQuickOrder}
                                disabled={!product.ignore_stock && product.stock_quantity === 0}
                            >
                                <Zap className={cn("me-2", product.skip_cart ? "w-6 h-6" : "w-5 h-5 md:w-4 md:h-4")} />
                                {language === 'ar' ? 'اطلب الآن (شراء مباشر)' : 'Order Now (Buy Now)'}
                            </Button>
                        </div>

                        {/* Shipping Info Bottom */}
                        <div className="bg-muted/30 p-3 rounded-lg text-center text-sm text-muted-foreground">
                            {product.free_shipping
                                ? (language === 'ar' ? '✨ شحن مجاني لهذا المنتج' : '✨ Free Shipping for this product')
                                : (() => {
                                    const shipping = store.settings?.shipping;
                                    if (shipping?.type === 'fixed') {
                                        const cost = Number(shipping.fixed_price) || 0;
                                        return cost === 0
                                            ? (language === 'ar' ? '✨ شحن مجاني لهذا المنتج' : '✨ Free Shipping')
                                            : (language === 'ar' ? `🚚 تكلفة الشحن: ${formatPrice(cost)}` : `🚚 Shipping Cost: ${formatPrice(cost)}`);
                                    } else if (shipping?.type === 'dynamic') {
                                        return language === 'ar' ? '🚚 يتم حساب الشحن حسب محافظتك' : '🚚 Shipping calculated at checkout';
                                    }
                                    return null;
                                })()}
                        </div>
                    </div>
                    {/* Quick Order Dialog */}
                    <QuickOrderForm
                        isOpen={quickOrderOpen}
                        onClose={() => setQuickOrderOpen(false)}
                        product={product}
                        quantity={quantity}
                        subtotal={totalPrice}
                        variants={variants}
                        selections={selections}
                        store={store}
                    />
                </div>
            </div>
        </div>
    );
}
