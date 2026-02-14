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

interface ProductDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: any;
    language: 'ar' | 'en';
}

export function ProductDetailsDialog({ open, onOpenChange, product, language }: ProductDetailsDialogProps) {
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
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{language === 'ar' ? 'تفاصيل المنتج' : 'Product Details'}</DialogTitle>
                    <DialogDescription>
                        {getName(product)}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                                {images[0] ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={images[0]} alt={getName(product)} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full text-gray-400">
                                        No Image
                                    </div>
                                )}
                            </div>
                            {images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {images.map((img: string, i: number) => (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img key={i} src={img} alt="" className="w-20 h-20 object-cover rounded-md border" />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">{language === 'ar' ? 'الوصف' : 'Description'}</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                    {getDescription(product)}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <span className="text-sm text-muted-foreground block mb-1">
                                        {language === 'ar' ? 'السعر' : 'Price'}
                                    </span>
                                    <span className="text-xl font-bold">
                                        {product.price} {product.currency}
                                    </span>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <span className="text-sm text-muted-foreground block mb-1">
                                        {language === 'ar' ? 'المخزون' : 'Stock'}
                                    </span>
                                    <span className="text-xl font-bold">
                                        {product.stock_quantity}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <span className="text-sm font-medium">
                                    {language === 'ar' ? 'الحالة' : 'Status'}
                                </span>
                                <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                    {product.status}
                                </Badge>
                            </div>

                            {product.sku && (
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <span className="text-sm font-medium">SKU</span>
                                    <span className="font-mono text-sm">{product.sku}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
