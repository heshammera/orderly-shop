import React from 'react';
import { CheckoutPage } from '@/components/store/CheckoutPage';

export default function MainCheckout({ storeContext, settings, blocks }: { storeContext?: any, settings?: any, blocks?: any[] }) {
    if (!storeContext?.store) {
        return (
            <div className="p-16 text-center text-muted-foreground w-full">
                <p>عينة من صفحة الدفع تظهر هنا</p>
            </div>
        );
    }

    return (
        <section id="checkout-page" className="bg-white py-16 elegance-checkout-page">
            <div className="container mx-auto px-4">
                {settings?.heading && (
                    <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b pb-4">{settings.heading}</h1>
                )}

                <CheckoutPage
                    store={storeContext.store}
                    pageSchema={storeContext.legacyCheckoutSchema}
                    themeSettings={settings}
                    themeBlocks={blocks}
                />
            </div>
        </section>
    );
}
