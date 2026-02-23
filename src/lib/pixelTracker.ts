"use client";

/**
 * usePixelTracker — Unified pixel event tracking for Facebook, TikTok, and Snapchat.
 * 
 * Automatically fires standard e-commerce events to all configured pixels.
 * Store owners only need to add their Pixel ID — no manual event builder required.
 * 
 * Events tracked:
 *   - ViewContent  → when a product page is viewed
 *   - AddToCart     → when a product is added to cart
 *   - InitiateCheckout → when the checkout page is opened
 *   - Purchase      → when an order is completed
 */

// ─── Helpers ────────────────────────────────────────────────

function getFbq(): any {
    if (typeof window !== 'undefined' && (window as any).fbq) return (window as any).fbq;
    return null;
}

function getTtq(): any {
    if (typeof window !== 'undefined' && (window as any).ttq) return (window as any).ttq;
    return null;
}

function getSnaptr(): any {
    if (typeof window !== 'undefined' && (window as any).snaptr) return (window as any).snaptr;
    return null;
}

// ─── Event Functions ────────────────────────────────────────

/**
 * ViewContent — fires when a customer views a product page
 */
export function trackViewContent(params: {
    content_id: string;
    content_name: string;
    content_type?: string;
    currency: string;
    value: number;
}) {
    try {
        const fbq = getFbq();
        if (fbq) {
            fbq('track', 'ViewContent', {
                content_ids: [params.content_id],
                content_name: params.content_name,
                content_type: params.content_type || 'product',
                currency: params.currency,
                value: params.value,
            });
        }

        const ttq = getTtq();
        if (ttq) {
            ttq.track('ViewContent', {
                contents: [{
                    content_id: params.content_id,
                    content_name: params.content_name,
                    content_type: params.content_type || 'product',
                }],
                currency: params.currency,
                value: params.value,
            });
        }

        const snaptr = getSnaptr();
        if (snaptr) {
            snaptr('track', 'VIEW_CONTENT', {
                item_ids: [params.content_id],
                item_category: params.content_type || 'product',
                currency: params.currency,
                price: params.value,
            });
        }
    } catch (e) {
        console.warn('[PixelTracker] ViewContent error:', e);
    }
}

/**
 * AddToCart — fires when a customer adds a product to their cart
 */
export function trackAddToCart(params: {
    content_id: string;
    content_name: string;
    content_type?: string;
    currency: string;
    value: number;
    quantity: number;
}) {
    try {
        const fbq = getFbq();
        if (fbq) {
            fbq('track', 'AddToCart', {
                content_ids: [params.content_id],
                content_name: params.content_name,
                content_type: params.content_type || 'product',
                currency: params.currency,
                value: params.value,
                num_items: params.quantity,
            });
        }

        const ttq = getTtq();
        if (ttq) {
            ttq.track('AddToCart', {
                contents: [{
                    content_id: params.content_id,
                    content_name: params.content_name,
                    content_type: params.content_type || 'product',
                    quantity: params.quantity,
                    price: params.value,
                }],
                currency: params.currency,
                value: params.value,
            });
        }

        const snaptr = getSnaptr();
        if (snaptr) {
            snaptr('track', 'ADD_CART', {
                item_ids: [params.content_id],
                item_category: params.content_type || 'product',
                currency: params.currency,
                price: params.value,
                number_items: params.quantity,
            });
        }
    } catch (e) {
        console.warn('[PixelTracker] AddToCart error:', e);
    }
}

/**
 * InitiateCheckout — fires when the checkout page is opened
 */
export function trackInitiateCheckout(params: {
    content_ids: string[];
    currency: string;
    value: number;
    num_items: number;
}) {
    try {
        const fbq = getFbq();
        if (fbq) {
            fbq('track', 'InitiateCheckout', {
                content_ids: params.content_ids,
                content_type: 'product',
                currency: params.currency,
                value: params.value,
                num_items: params.num_items,
            });
        }

        const ttq = getTtq();
        if (ttq) {
            ttq.track('InitiateCheckout', {
                contents: params.content_ids.map(id => ({
                    content_id: id,
                    content_type: 'product',
                })),
                currency: params.currency,
                value: params.value,
            });
        }

        const snaptr = getSnaptr();
        if (snaptr) {
            snaptr('track', 'START_CHECKOUT', {
                item_ids: params.content_ids,
                currency: params.currency,
                price: params.value,
                number_items: params.num_items,
            });
        }
    } catch (e) {
        console.warn('[PixelTracker] InitiateCheckout error:', e);
    }
}

/**
 * Purchase — fires when an order is completed successfully
 */
export function trackPurchase(params: {
    content_ids: string[];
    content_type?: string;
    currency: string;
    value: number;
    num_items: number;
    order_id?: string;
}) {
    try {
        const fbq = getFbq();
        if (fbq) {
            fbq('track', 'Purchase', {
                content_ids: params.content_ids,
                content_type: params.content_type || 'product',
                currency: params.currency,
                value: params.value,
                num_items: params.num_items,
            });
        }

        const ttq = getTtq();
        if (ttq) {
            ttq.track('CompletePayment', {
                contents: params.content_ids.map(id => ({
                    content_id: id,
                    content_type: params.content_type || 'product',
                })),
                currency: params.currency,
                value: params.value,
            });
        }

        const snaptr = getSnaptr();
        if (snaptr) {
            snaptr('track', 'PURCHASE', {
                item_ids: params.content_ids,
                currency: params.currency,
                price: params.value,
                number_items: params.num_items,
                transaction_id: params.order_id,
            });
        }
    } catch (e) {
        console.warn('[PixelTracker] Purchase error:', e);
    }
}
