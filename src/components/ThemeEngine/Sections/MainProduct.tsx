import React from 'react';
import { ProductDetail } from '@/components/store/ProductDetail';
import schemaData from '@/themes/default/sections/MainProduct/schema.json';

export default function MainProduct({ storeContext, settings, blocks }: { storeContext?: any, settings?: any, blocks?: any[] }) {
    if (!storeContext?.product) {
        return (
            <div className="p-16 text-center text-muted-foreground w-full">
                <p>عينة من صفحة المنتج الرئيسي تظهر هنا</p>
            </div>
        );
    }

    return (
        <ProductDetail
            product={storeContext.product}
            variants={storeContext.variants}
            upsellOffers={storeContext.upsellOffers}
            store={storeContext.store}
            themeSettings={{ ...settings, blocks }}
        />
    );
}

export const schema = schemaData;
