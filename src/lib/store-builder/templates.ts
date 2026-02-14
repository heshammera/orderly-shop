import { PageSchema, ComponentSchema } from './types';

export interface StoreTemplate {
    id: string;
    name: { en: string; ar: string };
    description: { en: string; ar: string };
    icon: string; // Lucide icon name or image path
    color: string;
    schema: PageSchema;
}

const createSection = (type: any, content: any = {}, settings: any = {}): ComponentSchema => ({
    id: crypto.randomUUID(),
    type,
    content,
    settings,
});

export const STORE_TEMPLATES: StoreTemplate[] = [
    {
        id: 'modern',
        name: { en: 'Modern Vogue', ar: 'عصري وحديث' },
        description: {
            en: 'Bold typography and full-width imagery. Perfect for fashion and lifestyle.',
            ar: 'خطوط عريضة وصور كاملة العرض. مثالي للأزياء ونمط الحياة.'
        },
        icon: 'Zap',
        color: 'bg-indigo-500',
        schema: {
            globalSettings: {
                colors: { primary: '#6366f1', secondary: '#1e293b', background: '#ffffff', text: '#0f172a' },
                font: 'Inter'
            },
            sections: [
                createSection('Header', {
                    logoText: { en: 'STORE', ar: 'المتجر' },
                    navLinks: [
                        { label: { en: 'Home', ar: 'الرئيسية' }, href: '/' },
                        { label: { en: 'Shop', ar: 'التسوق' }, href: '/products' },
                        { label: { en: 'About', ar: 'من نحن' }, href: '/about' }
                    ]
                }),
                createSection('Hero', {
                    title: { en: 'New Collection', ar: 'تشكيلة جديدة' },
                    subtitle: { en: 'Discover our latest arrivals for the season.', ar: 'اكتشف أحدث منتجاتنا لهذا الموسم.' },
                    buttonText: { en: 'Shop Now', ar: 'تسوق الآن' },
                    overlayOpacity: 0.4
                }, { height: '600px', textAlign: 'center' }),
                createSection('Features', {
                    title: { en: 'Why Choose Us', ar: 'لماذا تختارنا' },
                    features: [
                        { title: { en: 'Fast Shipping', ar: 'شحن سريع' }, description: { en: 'Free delivery on all orders', ar: 'توصيل مجاني لجميع الطلبات' } },
                        { title: { en: 'Premium Quality', ar: 'جودة عالية' }, description: { en: 'Certified top materials', ar: 'مواد معتمدة عالية الجودة' } },
                        { title: { en: '24/7 Support', ar: 'دعم فني' }, description: { en: 'We are here to help', ar: 'نحن هنا للمساعدة على مدار الساعة' } }
                    ]
                }),
                createSection('ProductGrid', {
                    title: { en: 'Trending Now', ar: 'الأكثر مبيعاً' },
                    limit: 8
                }),
                createSection('Newsletter', {
                    title: { en: 'Join Our Newsletter', ar: 'اشترك في نشرتنا البريدية' },
                    subtitle: { en: 'Get 10% off your first order', ar: 'احصل على خصم 10% على طلبك الأول' }
                }),
                createSection('Footer', {
                    copyright: { en: '© 2024 All Rights Reserved', ar: '© 2024 جميع الحقوق محفوظة' }
                })
            ]
        }
    },
    {
        id: 'classic',
        name: { en: 'Classic Store', ar: 'المتجر الكلاسيكي' },
        description: {
            en: 'Traditional and trustworthy layout. Great for electronics and general retail.',
            ar: 'تصميم تقليدي وموثوق. ممتاز للإلكترونيات وتجارة التجزئة العامة.'
        },
        icon: 'Store',
        color: 'bg-emerald-600',
        schema: {
            globalSettings: {
                colors: { primary: '#059669', secondary: '#475569', background: '#f8fafc', text: '#334155' },
                font: 'Inter'
            },
            sections: [
                createSection('Header', {}),
                createSection('Banner', {
                    text: { en: 'Special Offer: 50% Off Selected Items', ar: 'عرض خاص: خصم 50% على أصناف مختارة' }
                }, { backgroundColor: '#f59e0b', color: '#fff' }),
                createSection('Hero', {
                    title: { en: 'Welcome to Our Store', ar: 'مرحباً بكم في متجرنا' },
                    subtitle: { en: 'Best products at best prices', ar: 'أفضل المنتجات بأفضل الأسعار' },
                    buttonText: { en: 'View Offers', ar: 'عرض العروض' }
                }, { height: '400px', textAlign: 'left' }),
                createSection('ProductGrid', { title: { en: 'Featured Products', ar: 'منتجات مميزة' }, limit: 4 }),
                createSection('Banner', {
                    text: { en: 'Free Shipping on orders over $100', ar: 'شحن مجاني للطلبات فوق 100 دولار' }
                }),
                createSection('Testimonials', {
                    title: { en: 'What Customers Say', ar: 'آراء العملاء' }
                }),
                createSection('FAQ', {}),
                createSection('Footer', {})
            ]
        }
    },
    {
        id: 'minimal',
        name: { en: 'Minimalist', ar: 'بسيط (Minimal)' },
        description: {
            en: 'Clean, whitespace-heavy design. Ideal for art, decor, and luxury goods.',
            ar: 'تصميم نظيف وبسيط. مثالي للفن، الديكور، والسلع الفاخرة.'
        },
        icon: 'Feather',
        color: 'bg-slate-800',
        schema: {
            globalSettings: {
                colors: { primary: '#18181b', secondary: '#71717a', background: '#ffffff', text: '#09090b' },
                font: 'Inter'
            },
            sections: [
                createSection('Header', { logoText: { en: 'M I N I M A L', ar: 'ب س ي ط' } }, { backgroundColor: '#fff', color: '#000' }),
                createSection('Hero', {
                    title: { en: 'Less is More', ar: 'الأبسط هو الأجمل' },
                    subtitle: { en: 'Curated essentials for your home.', ar: 'أساسيات مختارة لمنزلك.' },
                    buttonText: { en: 'Explore', ar: 'استكشف' }
                }, { height: '500px', backgroundColor: '#f8f8f8', color: '#333' }),
                createSection('ProductGrid', { title: { en: 'Collection', ar: 'المجموعة' }, limit: 12 }),
                createSection('ContactForm', { title: { en: 'Get in Touch', ar: 'تواصل معنا' } }),
                createSection('Footer', {})
            ]
        }
    }
];
