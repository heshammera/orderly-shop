"use client";

import { useEffect, useState } from 'react';
import { RenderEngine } from '@/components/store/builder/RenderEngine';
import { CheckoutProvider } from '@/contexts/CheckoutContext';
import { PageSchema, COMPONENT_DEFAULTS, ComponentSchema } from '@/lib/store-builder/types';
import { Loader2 } from 'lucide-react';

interface CheckoutPageProps {
    store: any;
    pageSchema: PageSchema | null;
    themeSettings?: any;
    themeBlocks?: any[];
}

export function CheckoutPage({ store, pageSchema, themeSettings, themeBlocks }: CheckoutPageProps) {
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

    const modifiedSchema = JSON.parse(JSON.stringify(schema)); // deep clone

    if (themeSettings) {
        const checkoutFormSection = modifiedSchema.sections.find((s: any) => s.type === 'CheckoutForm');
        if (checkoutFormSection) {
            checkoutFormSection.content = checkoutFormSection.content || {};
            if (themeSettings.form_title) checkoutFormSection.content.title = themeSettings.form_title;
        }

        const orderSummarySection = modifiedSchema.sections.find((s: any) => s.type === 'OrderSummary');
        if (orderSummarySection) {
            orderSummarySection.content = orderSummarySection.content || {};
            if (themeSettings.button_text) orderSummarySection.content.buttonText = themeSettings.button_text;
        }
    }

    if (themeBlocks && themeBlocks.length > 0) {
        // 1. Trust Badges
        const trustBadgeBlocks = themeBlocks.filter(b => b.type === 'trust_badge');
        if (trustBadgeBlocks.length > 0) {
            const trustBadgesSection = modifiedSchema.sections.find((s: any) => s.type === 'TrustBadges');
            if (trustBadgesSection) {
                trustBadgesSection.content = trustBadgesSection.content || {};
                trustBadgesSection.content.badges = trustBadgeBlocks.map((b: any) => ({
                    id: Math.random().toString(),
                    title: b.settings?.title || '',
                    image: b.settings?.image || ''
                }));
            }
        }

        // 2. Checkout Fields
        const fieldBlockTypes = ['checkout_field', 'custom_text_field', 'custom_textarea_field'];
        const checkoutFieldBlocks = themeBlocks.filter(b => fieldBlockTypes.includes(b.type));

        if (checkoutFieldBlocks.length > 0) {
            const checkoutFormSection = modifiedSchema.sections.find((s: any) => s.type === 'CheckoutForm');
            if (checkoutFormSection) {
                checkoutFormSection.settings = checkoutFormSection.settings || {};
                // Map the blocks to a structured array that CheckoutForm understands
                checkoutFormSection.settings.checkoutFields = checkoutFieldBlocks.map((block: any, index: number) => ({
                    id: block.id, // Generate an ID if needed, or use the block's internal ID
                    type: block.type,
                    field_id: block.settings.field_id, // For standard fields
                    label: block.settings.label, // For custom fields
                    placeholder: block.settings.placeholder,
                    required: block.settings.required,
                    visible: block.type === 'checkout_field' ? block.settings.visible : true, // Custom fields are always visible if added
                    order: index
                }));
            }
        }
    }

    const headerSection = modifiedSchema.sections.find((s: any) => s.type === 'CheckoutHeader');
    const otherSections = modifiedSchema.sections.filter((s: any) => s.type !== 'CheckoutHeader');

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
                        schema={{ ...modifiedSchema, sections: [headerSection] }}
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
                                    ...modifiedSchema,
                                    sections: otherSections.filter((s: any) => s.type !== 'OrderSummary')
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
                                    ...modifiedSchema,
                                    sections: otherSections.filter((s: any) => s.type === 'OrderSummary')
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
