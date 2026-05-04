"use client";

import { HypeTemplate } from './templates/HypeTemplate';
import { ElegantTemplate } from './templates/ElegantTemplate';
import { TrustTemplate } from './templates/TrustTemplate';

export type LandingTemplate = 'hype' | 'elegant' | 'trust';

interface LandingContent {
    headline?: { ar: string; en: string };
    subheadline?: { ar: string; en: string };
    cta_text?: { ar: string; en: string };
    benefits?: Array<{ ar: string; en: string }>;
    guarantee_text?: { ar: string; en: string };
    testimonials?: Array<{ name: string; text: { ar: string; en: string }; rating: number }>;
    hero_image?: string;
    accent_color?: string;
    bg_color?: string;
}

interface ProductData {
    name: { ar: string; en: string };
    price: number;
    sale_price?: number;
    currency: string;
    images: string[];
}

interface LandingPageRendererProps {
    template: LandingTemplate;
    content: LandingContent;
    product: ProductData;
    language: 'ar' | 'en';
    storeSlug: string;
    productId: string;
    isPreview?: boolean;
}

export function LandingPageRenderer({
    template,
    content,
    product,
    language,
    storeSlug,
    productId,
    isPreview = false,
}: LandingPageRendererProps) {
    const props = { content, product, language, storeSlug, productId, isPreview };

    switch (template) {
        case 'hype':
            return <HypeTemplate {...props} />;
        case 'elegant':
            return <ElegantTemplate {...props} />;
        case 'trust':
            return <TrustTemplate {...props} />;
        default:
            return <TrustTemplate {...props} />;
    }
}
