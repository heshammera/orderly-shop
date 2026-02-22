"use client";

import { useEffect, useState } from 'react';
import { RenderEngine } from '@/components/store/builder/RenderEngine';
import { CheckoutProvider } from '@/contexts/CheckoutContext';
import { PageSchema, COMPONENT_DEFAULTS, ComponentSchema } from '@/lib/store-builder/types';
import { Loader2 } from 'lucide-react';

interface CheckoutPageProps {
    store: any;
    pageSchema: PageSchema | null;
}

export function CheckoutPage({ store, pageSchema }: CheckoutPageProps) {
    // Default Schema if not customized
    const schema = pageSchema || {
        globalSettings: {
            colors: { primary: '#000000', secondary: '#ffffff', background: '#f8f9fa', text: '#1f2937' },
            font: 'Inter'
        },
        sections: [
            { ...COMPONENT_DEFAULTS['CheckoutHeader'], id: 'default-header' } as ComponentSchema,
            { ...COMPONENT_DEFAULTS['CheckoutForm'], id: 'default-form' } as ComponentSchema,
            { ...COMPONENT_DEFAULTS['OrderSummary'], id: 'default-summary' } as ComponentSchema,
            { ...COMPONENT_DEFAULTS['TrustBadges'], id: 'default-badges' } as ComponentSchema,
        ]
    } as PageSchema;

    if (!store) return <Loader2 className="animate-spin" />;

    return (
        <CheckoutProvider store={store}>
            <div className="min-h-screen bg-slate-50">
                <RenderEngine
                    schema={schema}
                    storeId={store.id}
                    storeCurrency={store.currency}
                    storeSlug={store.slug}
                />
            </div>
        </CheckoutProvider>
    );
}
