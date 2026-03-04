import React from 'react';
import { CheckoutPage } from '@/components/store/CheckoutPage';
import checkoutSchema from '@/themes/default/sections/MainCheckout/schema.json';

export default function MainCheckout({ storeContext, settings, blocks }: { storeContext?: any, settings?: any, blocks?: any[] }) {
    if (!storeContext?.store) {
        return (
            <div className="p-16 text-center text-muted-foreground w-full">
                <p>عينة من صفحة الدفع تظهر هنا</p>
            </div>
        );
    }

    return (
        <CheckoutPage
            store={storeContext.store}
            pageSchema={storeContext.legacyCheckoutSchema}
            themeSettings={settings}
            themeBlocks={blocks}
        />
    );
}

export const schema = checkoutSchema;
