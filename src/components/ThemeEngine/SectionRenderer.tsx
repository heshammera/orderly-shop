import React from 'react';
import { themeRegistries } from '@/themes';

interface PageData {
    sections_order: string[];
    sections_data: Record<string, any>;
}

export default function SectionRenderer({ pageData, storeContext, themeName = 'default' }: { pageData: PageData, storeContext?: any, themeName?: string }) {
    const { sections_order, sections_data } = pageData;

    if (!sections_order || !sections_data) return null;

    const currentRegistry = themeRegistries[themeName] || themeRegistries['default'];

    const storeIdentifier = storeContext?.store?.slug || storeContext?.storeData?.slug || storeContext?.slug || storeContext?.id || '';

    // Deep mapping of links to resolve them dynamically to the correct storefront url
    const resolveLinks = (obj: any): any => {
        if (!obj || !storeIdentifier) return obj;
        if (typeof obj === 'string') {
            const productMatch = obj.match(/^\/product(s)?\/(.+)$/);
            if (productMatch) {
                return `/s/${storeIdentifier}/p/${productMatch[2]}`;
            }
            const categoryMatch = obj.match(/^\/categor(y|ies)\/(.+)$/);
            if (categoryMatch) {
                return `/s/${storeIdentifier}/products?category=${categoryMatch[2]}`;
            }
            if (obj === '/products' || obj === '/products/') {
                return `/s/${storeIdentifier}/products`;
            }
            if (obj === '/categories' || obj === '/categories/') {
                return `/s/${storeIdentifier}/products`;
            }
            // Add root replacement if needed
            if (obj === '/') {
                return `/s/${storeIdentifier}`;
            }
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(item => resolveLinks(item));
        }
        if (typeof obj === 'object') {
            const newObj: any = {};
            for (const key in obj) {
                newObj[key] = resolveLinks(obj[key]);
            }
            return newObj;
        }
        return obj;
    };

    return (
        <div className="theme-layout-builder flex flex-col w-full">
            {sections_order.map((sectionId) => {
                const sectionContent = sections_data[sectionId];

                if (!sectionContent) return null;

                const SectionComponent = currentRegistry[sectionContent.type as keyof typeof currentRegistry];

                if (!SectionComponent) {
                    console.warn(`Section type ${sectionContent.type} not found in registry.`);
                    return null;
                }

                let resolvedSettings = resolveLinks(sectionContent.settings) || {};
                const resolvedBlocks = resolveLinks(sectionContent.blocks);

                // If this is a footer, provide public store contacts as fallback
                if (sectionContent.type === 'footer' && storeContext?.store?.settings?.public_contact) {
                    const publicContact = storeContext.store.settings.public_contact;
                    resolvedSettings = {
                        ...resolvedSettings,
                        contact_email: resolvedSettings.contact_email || publicContact.email,
                        contact_phone: resolvedSettings.contact_phone || publicContact.phone,
                    };
                }

                return (
                    <section key={sectionId} id={sectionId} className="w-full relative">
                        <SectionComponent
                            settings={resolvedSettings}
                            blocks={resolvedBlocks}
                            storeContext={storeContext}
                        />
                    </section>
                );
            })}
        </div>
    );
}
