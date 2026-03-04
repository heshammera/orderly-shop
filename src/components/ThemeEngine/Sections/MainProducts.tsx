import React from 'react';
import { StoreProducts } from '@/components/store/StoreProducts';

interface MainProductsProps {
    settings?: any;
    blocks?: any[];
    storeContext?: any;
}

export default function MainProducts({ settings, blocks, storeContext }: MainProductsProps) {
    if (!storeContext || !storeContext.productsContext) {
        return <div className="p-8 text-center text-muted-foreground">Products context not found</div>;
    }

    const { store, initialCategories, initialProducts } = storeContext.productsContext;

    return (
        <StoreProducts
            store={store}
            initialCategories={initialCategories}
            initialProducts={initialProducts}
        />
    );
}
