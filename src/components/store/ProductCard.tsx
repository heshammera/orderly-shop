"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext'; // Assuming this context exists or will be created
import { toast } from 'sonner';

interface ProductCardProps {
    product: any;
    storeId: string; // Or storeSlug
}

export function ProductCard({ product, storeId }: ProductCardProps) {
    // Helper to safer parse JSON names
    const getName = (json: any) => {
        if (typeof json === 'string') {
            try {
                const parsed = JSON.parse(json);
                return parsed.en || parsed.ar || json;
            } catch { return json; }
        }
        return json.en || json.ar || 'Unknown Product';
    };

    const name = getName(product.name);
    const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
    const image = images?.[0] || '/placeholder-product.jpg';

    return (
        <div className="group relative border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all bg-white flex flex-col h-full">
            <Link href={`/s/${storeId}/p/${product.id}`} className="block aspect-square relative overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={image}
                    alt={name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
            </Link>

            <div className="p-4 flex flex-col flex-grow">
                <Link href={`/s/${storeId}/p/${product.id}`} className="hover:underline">
                    <h3 className="font-semibold text-lg line-clamp-1 mb-1">{name}</h3>
                </Link>

                <div className="flex items-center justify-between mt-auto pt-4">
                    <p className="font-bold text-lg text-primary">
                        {product.price} {product.currency || 'USD'}
                    </p>
                    <Button size="sm" variant="secondary" className="rounded-full w-8 h-8 p-0" asChild>
                        <Link href={`/s/${storeId}/p/${product.id}`}>
                            <ShoppingCart className="w-4 h-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
