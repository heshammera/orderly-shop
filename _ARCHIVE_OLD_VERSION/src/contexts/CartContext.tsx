import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
// import { useAuth } from '@/contexts/AuthContext';
// Note: We might need a specific CustomerAuthContext if AuthContext is only for Admins.
// For now, checking supabase.auth directly or assuming generic Auth which handles both.

interface CartItem {
    id?: string; // DB ID
    productId: string;
    productName: { ar: string; en: string };
    productImage: string | null;
    basePrice: number;
    unitPrice: number;
    quantity: number;
    variants: any[]; // JSON structure of variants
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
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [cartId, setCartId] = useState<string | null>(null);
    const [customerId, setCustomerId] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        // Check local storage primarily for fast load
        const savedCart = localStorage.getItem(`cart_${storeId}`);
        if (savedCart) {
            setCart(JSON.parse(savedCart));
            setLoading(false);
        }

        // Check Auth State
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setCustomerId(session.user.id);
                // Sync with DB
                fetchDbCart(session.user.id);
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                setCustomerId(session.user.id);
                await fetchDbCart(session.user.id);
            } else {
                setCustomerId(null);
                setCartId(null);
                // Fallback to local storage or clear if we want strict separation
            }
        });

        return () => subscription.unsubscribe();
    }, [storeId]);

    // Sync state to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem(`cart_${storeId}`, JSON.stringify(cart));
    }, [cart, storeId]);

    const fetchDbCart = async (userId: string) => {
        try {
            // 1. Find active cart
            const { data: carts } = await supabase
                .from('carts')
                .select('id')
                .eq('store_id', storeId)
                .eq('customer_id', userId)
                .eq('status', 'active')
                .limit(1);

            if (carts && carts.length > 0) {
                const dbCartId = carts[0].id;
                setCartId(dbCartId);

                // 2. Fetch Items
                const { data: items } = await supabase
                    .from('cart_items')
                    .select('*, product:products(*)')
                    .eq('cart_id', dbCartId);

                if (items) {
                    // Transform DB items to CartItem format
                    const mappedItems: CartItem[] = items.map((item: any) => ({
                        id: item.id,
                        productId: item.product_id,
                        productName: typeof item.product.name === 'string' ? JSON.parse(item.product.name) : item.product.name,
                        productImage: item.product.images?.[0] || null,
                        basePrice: item.product.price,
                        unitPrice: item.unit_price_at_addition,
                        quantity: item.quantity,
                        variants: item.variants, // Assuming we store robust variant info or just IDs
                        addedAt: item.created_at,
                    }));

                    // Merge Strategy: logical merge or DB overwrite?
                    // Simple: DB Overwrites Local if DB has items.
                    // Better: If Local has items and DB has items, we might want to merge.
                    // For MVP: Let's trust DB if it exists, otherwise use Local.
                    if (items.length > 0) {
                        setCart(mappedItems);
                    } else {
                        // If DB is empty, maybe push Local items to DB?
                        // Implementing generic sync later.
                    }
                }
            } else {
                // No DB cart yet, we might create one efficiently when needed
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

    const getOrCreateCartId = async (): Promise<string | null> => {
        if (cartId) return cartId;
        if (!customerId) return null; // Guest user - no DB cart for now (or strictly local)

        // Create Cart
        const { data, error } = await supabase
            .from('carts')
            .insert({
                store_id: storeId,
                customer_id: customerId,
                status: 'active'
            })
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
        // 1. Optimistic Update
        setCart(prev => {
            // Check for duplicates (same product + same variants)
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

        // 2. DB Sync
        if (customerId) {
            const cId = await getOrCreateCartId();
            if (cId) {
                // Check if item exists in DB
                // Ideally we'd need to query DB closely or just Insert.
                // Simplified: Just Insert new row for now, or Upsert if we had a unique constraint on (cart_id, product_id, variant_hash)
                // Let's just insert as new line item for simplicity, or try simple match.
                await supabase.from('cart_items').insert({
                    cart_id: cId,
                    product_id: newItem.productId,
                    quantity: newItem.quantity,
                    unit_price_at_addition: newItem.unitPrice,
                    variants: newItem.variants
                });
            }
        }
    };

    const removeFromCart = async (productId: string, variants: any[]) => {
        setCart(prev => prev.filter(item =>
            !(item.productId === productId && JSON.stringify(item.variants) === JSON.stringify(variants))
        ));

        if (cartId) {
            // Complex delete: need to match JSONB variants.
            // Doing strictly in JS/Client for now is hard without ID.
            // Ideally we start storing `id` in local state too.
            // For MVP: We won't perfectly sync Deletes without IDs.
            // Recommendation: Reload cart from DB after major ops, or store DB ID in local CartItem.
        }
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
        localStorage.removeItem(`cart_${storeId}`);
        if (cartId) {
            await supabase.from('cart_items').delete().eq('cart_id', cartId);
        }
    };

    const refreshCart = async () => {
        if (customerId) {
            await fetchDbCart(customerId);
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
