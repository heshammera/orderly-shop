"use client";

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface CartRecoveryHandlerProps {
    storeSlug: string;
}

export function CartRecoveryHandler({ storeSlug }: CartRecoveryHandlerProps) {
    const searchParams = useSearchParams();
    const { addToCart, clearCart, openCart } = useCart();
    const recoveryAttempted = useRef(false);

    useEffect(() => {
        const recoverId = searchParams.get('recover');
        if (!recoverId || recoveryAttempted.current) return;

        recoveryAttempted.current = true;

        const recoverCart = async () => {
            try {
                const res = await fetch(`/api/store/${storeSlug}/recover-cart?cartId=${recoverId}`);
                if (!res.ok) {
                    console.warn('Recovery cart not found or expired');
                    return;
                }

                const data = await res.json();
                if (!data.success || !data.cart?.items?.length) return;

                // Clear existing cart and add recovered items
                await clearCart();

                for (const item of data.cart.items) {
                    await addToCart({
                        productId: item.productId,
                        productName: item.productName,
                        productImage: item.productImage || null,
                        basePrice: item.unitPrice,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                        variants: item.variants || [],
                        addedAt: new Date().toISOString(),
                    });
                }

                // Open the cart drawer
                setTimeout(() => openCart(), 500);

                toast.success('تم استعادة سلة التسوق الخاصة بك!', {
                    description: 'يمكنك إكمال عملية الشراء الآن',
                    duration: 5000,
                });

                // Clean the URL (remove ?recover= param)
                const url = new URL(window.location.href);
                url.searchParams.delete('recover');
                window.history.replaceState({}, '', url.toString());

            } catch (error) {
                console.error('Cart recovery error:', error);
            }
        };

        recoverCart();
    }, [searchParams, storeSlug]);

    return null; // This is a side-effect-only component
}
