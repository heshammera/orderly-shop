"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ... (keep previous imports and interfaces) ...
interface ProductDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: any;
    language: 'ar' | 'en';
}

export function ProductDetailsDialog({ open, onOpenChange, product, language }: ProductDetailsDialogProps) {
    const supabase = createClient();
    const [variants, setVariants] = useState<any[]>([]);
    const [loadingVariants, setLoadingVariants] = useState(false);
    const [mainImage, setMainImage] = useState<string | null>(null);

    useEffect(() => {
        if (open && product?.id) {
            fetchVariants();
            const imgs = getImages(product);
            if (imgs.length > 0) {
                setMainImage(imgs[0]);
            }
        } else {
            setVariants([]);
            setMainImage(null);
        }
    }, [open, product?.id]);

    const fetchVariants = async () => {
        setLoadingVariants(true);
        const { data, error } = await supabase
            .from('product_variants')
            .select('*, variant_options(*)')
            .eq('product_id', product.id)
            .order('sort_order');

        if (!error && data) {
            const mapped = data.map((v: any) => ({
                ...v,
                name: typeof v.name === 'string' ? JSON.parse(v.name) : v.name,
                options: (v.variant_options || [])
                    .sort((a: any, b: any) => a.sort_order - b.sort_order)
                    .map((o: any) => ({
                        ...o,
                        label: typeof o.label === 'string' ? JSON.parse(o.label) : o.label,
                    }))
            }));
            setVariants(mapped);
        }
        setLoadingVariants(false);
    };

    if (!product) return null;

    const getName = (prod: any) => {
        try {
            return typeof prod.name === 'string' ? JSON.parse(prod.name)[language] || prod.name : prod.name[language];
        } catch {
            return prod.name;
        }
    };

    const getDescription = (prod: any) => {
        try {
            return typeof prod.description === 'string' ? JSON.parse(prod.description)[language] || prod.description : prod.description[language];
        } catch {
            return prod.description;
        }
    };

    const getImages = (prod: any) => {
        try {
            const imgs = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
            return Array.isArray(imgs) ? imgs : [imgs].filter(Boolean);
        } catch {
            return [prod.images].filter(Boolean);
        }
    };

    const images = getImages(product);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle className="text-xl">{language === 'ar' ? 'تفاصيل المنتج' : 'Product Details'}</DialogTitle>
                    <DialogDescription>
                        {getName(product)}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1">
                    <div className="p-6 grid gap-8 md:grid-cols-2">
                        {/* Left Column: Images */}
                        <div className="space-y-4">
                            <div className="aspect-square bg-muted rounded-xl overflow-hidden relative border shadow-sm">
                                {mainImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={mainImage} alt={getName(product)} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                                        No Image
                                    </div>
                                )}
                            </div>
                            {images.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide py-1">
                                    {images.map((img: string, i: number) => (
                                        <button
                                            key={i}
                                            onClick={() => setMainImage(img)}
                                            className={cn(
                                                "relative w-20 h-20 rounded-md overflow-hidden border-2 shrink-0 transition-all",
                                                mainImage === img ? "border-primary ring-2 ring-primary/20" : "border-transparent ring-1 ring-border opacity-70 hover:opacity-100"
                                            )}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right Column: Details & Variants */}
                        <div className="space-y-8">
                            {/* Basic Info */}
                            <div>
                                <h2 className="text-2xl font-bold mb-2">{getName(product)}</h2>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="px-3 py-1">
                                        {product.status === 'active' ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                                    </Badge>
                                    {product.sku && (
                                        <Badge variant="outline" className="px-3 py-1 font-mono text-xs">
                                            SKU: {product.sku}
                                        </Badge>
                                    )}
                                </div>
                                <div className="p-4 bg-muted/30 rounded-xl border border-border/50 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">{language === 'ar' ? 'السعر' : 'Price'}</p>
                                        <p className="text-2xl font-bold text-primary">{product.price} <span className="text-sm font-normal text-muted-foreground">{product.currency}</span></p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">{language === 'ar' ? 'إجمالي المخزون' : 'Total Stock'}</p>
                                        <p className="text-2xl font-bold">{product.stock_quantity}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Variants Section */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                                    {language === 'ar' ? 'المتغيرات (الخيارات)' : 'Variants (Options)'}
                                    {loadingVariants && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                                </h3>

                                {!loadingVariants && variants.length === 0 && (
                                    <p className="text-sm text-muted-foreground italic">
                                        {language === 'ar' ? 'لا توجد متغيرات لهذا المنتج.' : 'No variants for this product.'}
                                    </p>
                                )}

                                {!loadingVariants && variants.map((variant) => (
                                    <div key={variant.id} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium text-sm">
                                                {variant.name[language] || variant.name.ar}
                                                {variant.required && <span className="text-destructive mx-1">*</span>}
                                            </h4>
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                                {variant.display_type}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            {variant.options.map((option: any) => {
                                                const isStockOut = option.in_stock === false;
                                                const label = option.label[language] || option.label.ar;

                                                if (variant.display_type === 'color' || variant.option_type === 'color') {
                                                    return (
                                                        <div
                                                            key={option.id}
                                                            className="flex flex-col items-center gap-1"
                                                            title={isStockOut ? (language === 'ar' ? 'نفد من المخزون' : 'Out of stock') : undefined}
                                                        >
                                                            <div
                                                                className={cn(
                                                                    "w-10 h-10 rounded-full border shadow-sm relative flex items-center justify-center",
                                                                    isStockOut && "opacity-40 grayscale cursor-not-allowed"
                                                                )}
                                                                style={{ backgroundColor: option.value }}
                                                            >
                                                                {isStockOut && (
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <div className="w-full h-[2px] bg-red-500/80 rotate-45 transform" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground">{label}</span>
                                                            {option.price_modifier ? <span className="text-[10px] font-medium text-green-600">+{option.price_modifier}</span> : null}
                                                        </div>
                                                    );
                                                }

                                                if (variant.display_type === 'image' || variant.option_type === 'image') {
                                                    return (
                                                        <div
                                                            key={option.id}
                                                            className="flex flex-col items-center gap-1"
                                                            title={isStockOut ? (language === 'ar' ? 'نفد من المخزون' : 'Out of stock') : undefined}
                                                        >
                                                            <div
                                                                className={cn(
                                                                    "w-16 h-16 rounded-md border shadow-sm overflow-hidden relative",
                                                                    isStockOut && "opacity-40 grayscale cursor-not-allowed"
                                                                )}
                                                            >
                                                                {option.value ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img src={option.value} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="bg-muted w-full h-full flex items-center justify-center text-xs text-muted-foreground">Img</div>
                                                                )}
                                                                {isStockOut && (
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
                                                                        <span className="text-[10px] font-bold text-destructive bg-white/90 px-1 py-0.5 rounded shadow-sm border border-destructive/20 select-none">
                                                                            {language === 'ar' ? 'نفد' : 'Out'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground">{label}</span>
                                                            {option.price_modifier ? <span className="text-[10px] font-medium text-green-600">+{option.price_modifier}</span> : null}
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div
                                                        key={option.id}
                                                        className={cn(
                                                            "px-4 py-2 rounded-md border text-sm transition-all flex flex-col gap-1 items-center justify-center min-w-[3rem]",
                                                            isStockOut ? "opacity-40 bg-muted/50 line-through cursor-not-allowed" : "bg-card shadow-sm"
                                                        )}
                                                        title={isStockOut ? (language === 'ar' ? 'نفد من المخزون' : 'Out of stock') : undefined}
                                                    >
                                                        <span>
                                                            {label}
                                                            {isStockOut && (
                                                                <span className="ms-1 text-[10px] font-bold text-destructive no-underline inline-block">
                                                                    ({language === 'ar' ? 'نفد' : 'Out'})
                                                                </span>
                                                            )}
                                                        </span>
                                                        {option.price_modifier ? <span className="text-[10px] font-medium text-green-600 whitespace-nowrap">+{option.price_modifier} {product.currency}</span> : null}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Description */}
                            <div className="space-y-3 pt-6 border-t">
                                <h3 className="text-lg font-semibold">{language === 'ar' ? 'الوصف' : 'Description'}</h3>
                                <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/50">
                                    {getDescription(product) || (language === 'ar' ? 'لا يوجد وصف.' : 'No description provided.')}
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
