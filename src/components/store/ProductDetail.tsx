"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingCart, ChevronLeft, ChevronRight, Zap, Check, Loader2 } from 'lucide-react';
import { QuickOrderForm } from '@/components/store/QuickOrderForm';
import { cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';

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
    is_default: boolean;
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
                if (option?.price_modifier) {
                    itemPrice += option.price_modifier;
                }
            });
            total += itemPrice;
        }

        // Apply offer discount
        const offer = getApplicableOffer();
        if (offer) {
            if (offer.discount_type === 'percentage') {
                total = total * (1 - offer.discount_value / 100);
            } else {
                total = Math.max(0, total - offer.discount_value);
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

            // Add each item
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
                    };
                });

                const cartItem = {
                    productId: product.id,
                    productName: product.name,
                    productImage: product.images[0] || null,
                    basePrice: product.price,
                    unitPrice: effectiveUnitPrice,
                    quantity: 1,
                    variants: selectedVariants,
                    addedAt: new Date().toISOString(),
                };

                await addToCart(cartItem);
            }

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
        <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                {/* Image Gallery */}
                <div className="space-y-4">
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
                        <div className="flex gap-2 overflow-x-auto pb-2">
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

                {/* Product Info */}
                <div className="space-y-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-2">{productName}</h1>
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
                    </div>

                    {/* Upsell Offers - Radio Style */}
                    {upsellOffers.length > 0 && (
                        <div className="space-y-3">
                            <Label className="text-base">{language === 'ar' ? 'اختر العرض' : 'Select Offer'}</Label>
                            <RadioGroup
                                value={quantity.toString()}
                                onValueChange={(val) => setQuantity(parseInt(val))}
                                className="grid gap-3"
                            >
                                {/* Default option (1 item) */}
                                <div className={cn(
                                    "flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all",
                                    quantity === 1 ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                                )} onClick={() => setQuantity(1)}>
                                    <div className="flex items-center gap-3">
                                        <RadioGroupItem value="1" id="q-1" />
                                        <Label htmlFor="q-1" className="cursor-pointer font-medium">
                                            {language === 'ar' ? 'قطعة واحدة' : '1 Item'}
                                        </Label>
                                    </div>
                                    <span className="font-bold">{formatPrice(product.price)}</span>
                                </div>

                                {/* Offers */}
                                {upsellOffers.map((offer) => {
                                    const isSelected = quantity === offer.min_quantity;
                                    const badge = offer.badge[language] || offer.badge.ar;
                                    const label = offer.label[language] || offer.label.ar;
                                    return (
                                        <div
                                            key={offer.id}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all",
                                                isSelected ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                                            )}
                                            onClick={() => setQuantity(offer.min_quantity)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <RadioGroupItem value={offer.min_quantity.toString()} id={`q-${offer.min_quantity}`} />
                                                <div className="grid gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <Label htmlFor={`q-${offer.min_quantity}`} className="cursor-pointer font-medium">
                                                            {label || `${language === 'ar' ? 'اشتري' : 'Buy'} ${offer.min_quantity}`}
                                                        </Label>
                                                        {badge && <Badge variant="secondary" className="text-xs h-5 px-1.5">{badge}</Badge>}
                                                    </div>
                                                    <span className="text-xs text-green-600 font-medium">
                                                        {language === 'ar' ? 'توفير ' : 'Save '}
                                                        {offer.discount_type === 'percentage'
                                                            ? `${offer.discount_value}%`
                                                            : formatPrice(offer.discount_value)}
                                                    </span>
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
                                                                    onClick={() => handleOptionSelect(itemIndex, variant.id, option.id)}
                                                                    className={cn(
                                                                        "w-10 h-10 rounded-full border-2 transition-all relative flex items-center justify-center",
                                                                        isSelected ? "border-primary ring-2 ring-primary/20 scale-110" : "border-transparent ring-1 ring-border hover:scale-105"
                                                                    )}
                                                                    style={{ backgroundColor: option.value }}
                                                                    title={option.label[language] || option.label.ar}
                                                                >
                                                                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                                                                </button>
                                                            );
                                                        }

                                                        if (variant.display_type === 'image' || variant.option_type === 'image') {
                                                            return (
                                                                <button
                                                                    key={option.id}
                                                                    onClick={() => handleOptionSelect(itemIndex, variant.id, option.id)}
                                                                    className={cn(
                                                                        "w-16 h-16 rounded-md border-2 overflow-hidden relative transition-all",
                                                                        isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent ring-1 ring-border opacity-80 hover:opacity-100"
                                                                    )}
                                                                    title={option.label[language] || option.label.ar}
                                                                >
                                                                    {option.value ? (
                                                                        <img src={option.value} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="text-xs text-muted-foreground p-1">{option.label[language]}</span>
                                                                    )}
                                                                    {isSelected && (
                                                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                                            <Check className="w-6 h-6 text-white" />
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            );
                                                        }

                                                        return (
                                                            <button
                                                                key={option.id}
                                                                onClick={() => handleOptionSelect(itemIndex, variant.id, option.id)}
                                                                className={cn(
                                                                    "px-4 py-2 rounded-md border text-sm transition-all min-w-[3rem]",
                                                                    isSelected
                                                                        ? "border-primary bg-primary/10 text-primary font-medium"
                                                                        : "border-border hover:border-primary/50 text-muted-foreground bg-card"
                                                                )}
                                                            >
                                                                {option.label[language] || option.label.ar}
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
                            <div className="flex gap-4">
                                <Button
                                    size="lg"
                                    className="flex-1"
                                    onClick={handleAddToCart}
                                    disabled={addingToCart || product.stock_quantity === 0}
                                >
                                    {addingToCart ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ShoppingCart className="w-4 h-4 me-2" />
                                    )}
                                    {product.stock_quantity === 0
                                        ? (language === 'ar' ? 'نفذت الكمية' : 'Out of Stock')
                                        : (language === 'ar' ? 'إضافة للسلة' : 'Add to Cart')
                                    }
                                </Button>

                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="flex-1 border-primary text-primary hover:bg-primary/10"
                                    onClick={handleQuickOrder}
                                    disabled={product.stock_quantity === 0}
                                >
                                    <Zap className="w-4 h-4 me-2" />
                                    {language === 'ar' ? 'طلب سريع' : 'Quick Order'}
                                </Button>
                            </div>

                            {/* Shipping Info Bottom */}
                            <div className="bg-muted/30 p-3 rounded-lg text-center text-sm text-muted-foreground">
                                {(() => {
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
                            variants={variants}
                            selections={selections}
                            store={store}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
