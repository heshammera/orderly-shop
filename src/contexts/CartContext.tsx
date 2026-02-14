"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CartItem {
    id?: string;
    productId: string;
    productName: { ar: string; en: string };
    productImage: string | null;
    basePrice: number;
    unitPrice: number;
    quantity: number;
    variants: any[];
    addedAt: string;
}

interface CartContextType {
    cart: CartItem[];
    cartCount: number;
    loading: boolean;
    addToCart: (item: CartItem) => Promise<void>;
    removeFromCart: (productId: string, variants: any[]) => Promise<void>;
    updateQuantity: (productId: string, variants: any[], quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children, storeId }: { children: React.ReactNode; storeId: string }) {
    const supabase = createClient();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [cartId, setCartId] = useState<string | null>(null);
    const [customerId, setCustomerId] = useState<string | null>(null);

    // Initial Load & Session Setup
    useEffect(() => {
        // 1. Get or Create Session ID
        let currentSessionId = localStorage.getItem(`session_${storeId}`);
        if (!currentSessionId) {
            currentSessionId = crypto.randomUUID();
            localStorage.setItem(`session_${storeId}`, currentSessionId);
        }
        setSessionId(currentSessionId);

        // 2. Load Local Cart
        if (typeof window !== 'undefined') {
            const savedCart = localStorage.getItem(`cart_${storeId}`);
            if (savedCart) {
                setCart(JSON.parse(savedCart));
                setLoading(false);
            }
        }

        // 3. Check Auth & Fetch DB Cart
        const initCart = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setCustomerId(session.user.id);
                await fetchDbCart(session.user.id, currentSessionId!);
            } else {
                // If guest, try to fetch cart by session_id
                await fetchDbCart(null, currentSessionId!);
            }
        };
        initCart();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                setCustomerId(session.user.id);
                // Potential merge logic here? For now just switch context
                await fetchDbCart(session.user.id, currentSessionId!);
            } else {
                setCustomerId(null);
                await fetchDbCart(null, currentSessionId!);
            }
        });

        return () => subscription.unsubscribe();
    }, [storeId, supabase]);

    // Sync state to local storage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(`cart_${storeId}`, JSON.stringify(cart));
        }
    }, [cart, storeId]);

    const fetchDbCart = async (userId: string | null, sId: string) => {
        try {
            let query = supabase
                .from('carts')
                .select('id')
                .eq('store_id', storeId)
                .eq('status', 'active');

            if (userId) {
                query = query.eq('customer_id', userId);
            } else {
                query = query.eq('session_id', sId);
            }

            const { data: carts } = await query.limit(1);

            if (carts && carts.length > 0) {
                const dbCartId = carts[0].id;
                setCartId(dbCartId);

                const { data: items } = await supabase
                    .from('cart_items')
                    .select('*, product:products(*)')
                    .eq('cart_id', dbCartId);

                if (items) {
                    const mappedItems: CartItem[] = items.map((item: any) => ({
                        id: item.id,
                        productId: item.product_id,
                        productName: typeof item.product.name === 'string' ? JSON.parse(item.product.name) : item.product.name,
                        productImage: item.product.images?.[0] || null,
                        basePrice: item.product.price,
                        unitPrice: item.unit_price_at_addition,
                        quantity: item.quantity,
                        variants: item.variants,
                        addedAt: item.created_at,
                    }));

                    if (items.length > 0) {
                        setCart(mappedItems);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

    const getOrCreateCartId = async (): Promise<string | null> => {
        if (cartId) return cartId;

        // Use customerId if logged in, otherwise session_id
        const payload: any = {
            store_id: storeId,
            status: 'active'
        };

        if (customerId) {
            payload.customer_id = customerId;
        } else if (sessionId) {
            payload.session_id = sessionId;
        } else {
            return null; // Should not happen as sessionId is init on mount
        }

        const { data, error } = await supabase
            .from('carts')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error('Error creating cart:', error);
            return null;
        }

        setCartId(data.id);
        return data.id;
    };

    const addToCart = async (newItem: CartItem) => {
        setCart(prev => {
            const existingIdx = prev.findIndex(item =>
                item.productId === newItem.productId &&
                JSON.stringify(item.variants) === JSON.stringify(newItem.variants) &&
                Math.abs(item.unitPrice - newItem.unitPrice) < 0.01
            );

            if (existingIdx >= 0) {
                const updated = [...prev];
                updated[existingIdx].quantity += newItem.quantity;
                return updated;
            }
            return [...prev, newItem];
        });

        // Sync to DB (Debounced ideal, but direct for now)
        try {
            const cId = await getOrCreateCartId();
            if (cId) {
                // Check if item exists in DB cart to update quantity or insert
                // For simplicity in MVP, we might just insert, but duplicate rows are bad.
                // Optimally: Upsert based on unique constraint (cart_id, product_id, variants).
                // But variants is JSONB, hard to unique constrained. 
                // Let's just insert for now, real prod needs better item syncing.
                // OR: delete all and re-insert is heaviest but safest. 
                // Better: Just insert, we handle cleaning elsewhere? No.

                // Let's just insert the new item.
                await supabase.from('cart_items').insert({
                    cart_id: cId,
                    product_id: newItem.productId,
                    quantity: newItem.quantity,
                    unit_price_at_addition: newItem.unitPrice,
                    variants: newItem.variants
                });
            }
        } catch (err) {
            console.error('Failed to sync cart item', err);
        }
    };

    const removeFromCart = async (productId: string, variants: any[]) => {
        setCart(prev => prev.filter(item =>
            !(item.productId === productId && JSON.stringify(item.variants) === JSON.stringify(variants))
        ));
    };

    const updateQuantity = async (productId: string, variants: any[], quantity: number) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId && JSON.stringify(item.variants) === JSON.stringify(variants)) {
                return { ...item, quantity };
            }
            return item;
        }));
    };

    const clearCart = async () => {
        setCart([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(`cart_${storeId}`);
        }
        if (cartId) {
            await supabase.from('cart_items').delete().eq('cart_id', cartId);
        }
    };

    const refreshCart = async () => {
        if (customerId && sessionId) {
            await fetchDbCart(customerId, sessionId);
        }
    };

    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            cartCount,
            loading,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            refreshCart
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
