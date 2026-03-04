'use client';

import React, { useState, useEffect } from 'react';
import SectionRenderer from './SectionRenderer';
import ThemeVariables from './ThemeVariables';

interface ThemePreviewManagerProps {
    initialPageData: {
        sections_order: string[];
        sections_data: Record<string, any>;
    };
    initialTokens: Record<string, string>;
    isRTL?: boolean;
    storeContext?: any;
    themeName?: string;
}

export default function ThemePreviewManager({
    initialPageData,
    initialTokens,
    isRTL = true,
    storeContext,
    themeName = 'default'
}: ThemePreviewManagerProps) {
    const [pageData, setPageData] = useState(initialPageData);
    const [tokens, setTokens] = useState(initialTokens);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // In production, we'd verify the origin (e.g. event.origin === window.location.origin)
            const data = event.data;

            if (data?.type === 'UPDATE_SECTION_SETTING') {
                setPageData((prev) => ({
                    ...prev,
                    sections_data: {
                        ...prev.sections_data,
                        [data.sectionId]: {
                            ...prev.sections_data[data.sectionId],
                            settings: {
                                ...prev.sections_data[data.sectionId].settings,
                                ...data.settings
                            }
                        }
                    }
                }));
            }

            if (data?.type === 'UPDATE_GLOBAL_TOKEN') {
                setTokens((prev) => ({
                    ...prev,
                    ...data.tokens
                }));
            }

            if (data?.type === 'REPLACE_PAGE_DATA') {
                setPageData(data.pageData);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <>
            <ThemeVariables tokens={tokens} isRTL={isRTL} />
            <SectionRenderer pageData={pageData} storeContext={storeContext} themeName={themeName} />
        </>
    );
}
