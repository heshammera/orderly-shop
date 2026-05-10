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
    language = 'ar',
    storeSlug,
    productId,
    isPreview = false,
}: LandingPageRendererProps) {
    // Ensure all props are safe and defined
    const safeContent = content || {};
    const safeProduct = product || { name: { ar: '', en: '' }, price: 0, currency: 'SAR', images: [] };
    const safeLang = language || 'ar';

    const props = { 
        content: safeContent, 
        product: safeProduct, 
        language: safeLang, 
        storeSlug, 
        productId, 
        isPreview 
    };

    try {
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
    } catch (error) {
        console.error("LandingPageRenderer Error:", error);
        return (
            <div className="p-10 text-center bg-red-50 text-red-800 rounded-xl border border-red-200" dir="rtl">
                <h2 className="text-xl font-bold mb-2">عذراً، حدث خطأ أثناء عرض القالب</h2>
                <p className="text-sm opacity-80">يرجى محاولة تغيير القالب من لوحة التحكم أو التواصل مع الدعم التقني.</p>
                <div className="mt-4 text-[10px] font-mono opacity-50">Template: {template}</div>
            </div>
        );
    }
}
