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
            { type: 'CheckoutHeader', id: 'default-header', settings: {}, content: {} },
            { type: 'CheckoutForm', id: 'default-form', settings: { layout: 'split', showLabels: true }, content: {} },
            { type: 'OrderSummary', id: 'default-summary', settings: { sticky: true }, content: {} },
            { type: 'TrustBadges', id: 'default-badges', settings: {}, content: {} },
        ]
    } as PageSchema;

    const headerSection = schema.sections.find(s => s.type === 'CheckoutHeader');
    const otherSections = schema.sections.filter(s => s.type !== 'CheckoutHeader');

    if (!store) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
    );

    return (
        <CheckoutProvider store={store}>
            <div className="min-h-screen bg-[#f8fafc]">
                {/* Fixed Header */}
                {headerSection && (
                    <RenderEngine
                        schema={{ ...schema, sections: [headerSection] }}
                        storeId={store.id}
                        storeCurrency={store.currency}
                        storeSlug={store.slug}
                        fullHeight={false}
                    />
                )}

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">
                        {/* Left Side: Forms */}
                        <div className="w-full lg:col-span-7 xl:col-span-8 space-y-8">
                            <RenderEngine
                                schema={{
                                    ...schema,
                                    sections: otherSections.filter(s => s.type !== 'OrderSummary')
                                }}
                                storeId={store.id}
                                storeCurrency={store.currency}
                                storeSlug={store.slug}
                                fullHeight={false}
                            />
                        </div>

                        {/* Right Side: Order Summary (Sticky) */}
                        <aside className="w-full lg:col-span-5 xl:col-span-4 sticky top-24">
                            <RenderEngine
                                schema={{
                                    ...schema,
                                    sections: otherSections.filter(s => s.type === 'OrderSummary')
                                }}
                                storeId={store.id}
                                storeCurrency={store.currency}
                                storeSlug={store.slug}
                                fullHeight={false}
                            />
                        </aside>
                    </div>
                </main>
            </div>
        </CheckoutProvider>
    );
}
