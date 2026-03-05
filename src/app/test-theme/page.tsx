import React from 'react';
import ThemePreviewManager from '@/components/ThemeEngine/ThemePreviewManager';
import { CartProvider } from '@/contexts/CartContext';

export default function ThemeEngineTestPage() {

    // 1. Mocking Store Theme Settings (Global Tokens)
    const mockGlobalTokens = {
        // Primary Color: A vibrant purple
        'primary': '262.1 83.3% 57.8%',
        'primary-foreground': '210 40% 98%',

        // Background Color: Light Gray
        'background': '0 0% 100%',
        'foreground': '222.2 84% 4.9%',

        // Radius: Rounded corners
        'radius': '1rem'
    };

    // 2. Mocking Page Sections Data
    const pageData = {
        sections_order: ['header_1', 'hero_banner_1', 'category_slider_1', 'featured_grid_1', 'newsletter_1', 'footer_1'],
        sections_data: {
            'header_1': {
                type: 'header',
                settings: {
                    notice_text: '🔥 شحن مجاني للطلبات فوق 200 ريال!',
                    search_placeholder: 'ابحث عن منتج...'
                },
                blocks: [
                    { type: 'link', settings: { label: 'الرئيسية', url: '/' } },
                    { type: 'link', settings: { label: 'كل المنتجات', url: '/products' } },
                    { type: 'link', settings: { label: 'العروض', url: '/offers' } },
                    { type: 'link', settings: { title: 'الشحن والتوصيل', url: '/shipping' } }
                ]
            },
            'hero_banner_1': {
                type: 'hero_banner',
                settings: {
                    heading: 'اكتشف أحدث العروض الحصرية',
                    subheading: 'تسوق الآن واحصل على خصم 20% على جميع المنتجات الجديدة لفترة محدودة',
                    button_label: 'تسوق الآن',
                    background_image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000'
                },
                blocks: []
            },
            'category_slider_1': {
                type: 'category_slider',
                settings: {
                    heading: 'تسوق حسب التصنيف',
                    subheading: 'تصفح مجموعاتنا المتنوعة للاختيار بسهولة'
                },
                blocks: [
                    { type: 'category', settings: { title: 'ملابس رجالية', image_url: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=300&q=80', link: '/category/men' } },
                    { type: 'category', settings: { title: 'ملابس نسائية', image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80', link: '/category/women' } },
                    { type: 'category', settings: { title: 'إلكترونيات', image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&q=80', link: '/category/electronics' } },
                    { type: 'category', settings: { title: 'عطور', image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=300&q=80', link: '/category/perfumes' } }
                ]
            },
            'featured_grid_1': {
                type: 'featured_grid',
                settings: {
                    heading: 'استمتع بأحدث التشكيلات',
                    subheading: 'اخترنا لك بعناية مجموعة من أفضل المنتجات الفاخرة التي تناسبك',
                },
                blocks: [
                    { type: 'product', settings: { product_id: 'prod_1' } },
                    { type: 'product', settings: { product_id: 'prod_2' } },
                    { type: 'product', settings: { product_id: 'prod_3' } }
                ]
            },
            'footer_1': {
                type: 'footer',
                settings: {
                    about_heading: 'عن متجرنا',
                    about_text: 'نحن نقدم أفضل المنتجات جودة وأسعاراً تنافسية لعملائنا.',
                    links_heading: 'روابط سريعة',
                    contact_heading: 'تواصل معنا',
                    contact_email: 'support@example.com',
                    contact_phone: '+966 000 000 000',
                    copyright: 'جميع الحقوق محفوظة © 2026'
                },
                blocks: []
            },
            'newsletter_1': {
                type: 'newsletter',
                settings: {
                    heading: 'اشترك في نشرتنا البريدية',
                    subheading: 'احصل على آخر الأخبار والعروض الحصرية مباشرة في بريدك المكتبي.',
                    button_label: 'اشتراك',
                    placeholder: 'أدخل بريدك الإلكتروني'
                },
                blocks: []
            }
        }
    };

    return (
        <CartProvider storeId="test-store">
            <div className="min-h-screen bg-background text-foreground font-sans">
                <main>
                    <ThemePreviewManager
                        initialPageData={pageData}
                        initialTokens={mockGlobalTokens}
                        isRTL={true}
                    />
                </main>
            </div>
        </CartProvider>
    );
}
