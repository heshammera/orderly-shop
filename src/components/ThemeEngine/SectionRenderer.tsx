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

                return (
                    <section key={sectionId} id={sectionId} className="w-full relative">
                        <SectionComponent
                            settings={sectionContent.settings}
                            blocks={sectionContent.blocks}
                            storeContext={storeContext}
                        />
                    </section>
                );
            })}
        </div>
    );
}
