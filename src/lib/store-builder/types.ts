import { LucideIcon } from 'lucide-react';

export type ComponentType =
    | 'Header' | 'Footer' | 'Hero' | 'ProductGrid' | 'Features' | 'Banner' | 'Testimonials' | 'FAQ' | 'RichText' | 'ContactForm' | 'Newsletter'
    | 'CheckoutHeader' | 'CheckoutForm' | 'OrderSummary' | 'TrustBadges' | 'CountdownTimer' | 'BumpOffer' | 'SocialProof' | 'ExitIntentPopup';

export interface ComponentSchema {
    id: string;
    type: ComponentType;
    settings: Record<string, any>;
    content: Record<string, any>;
}

export interface PageSchema {
    sections: ComponentSchema[];
    globalSettings: {
        colors: {
            primary: string;
            secondary: string;
            background: string;
            text: string;
        };
        font: string;
    };
}

// Professional Default Layout
export const DEFAULT_STORE_LAYOUT: PageSchema = {
    globalSettings: {
        colors: {
            primary: '#0f172a', // Slate 900
            secondary: '#475569', // Slate 600
            background: '#ffffff',
            text: '#1e293b',
        },
        font: 'Inter',
    },
    sections: [
        {
            id: 'hero-1',
            type: 'Hero',
            settings: {
                height: 'large',
                align: 'center',
                overlayOpacity: 50
            },
            content: {
                title: {
                    en: 'Welcome to Our Premium Store',
                    ar: 'أهلاً بك في متجرنا المميز'
                },
                subtitle: {
                    en: 'Discover our exclusive collection of high-quality products.',
                    ar: 'اكتشف مجموعتنا الحصرية من المنتجات عالية الجودة.'
                },
                buttonText: {
                    en: 'Shop Now',
                    ar: 'تسوق الآن'
                },
                buttonLink: '#products',
                backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200'
            }
        },
        {
            id: 'features-1',
            type: 'Features',
            settings: {
                columns: 3,
                style: 'cards'
            },
            content: {
                features: [
                    {
                        title: { en: 'Fast Shipping', ar: 'شحن سريع' },
                        description: { en: 'We deliver specifically to you with speed and care.', ar: 'نقوم بالتوصيل لك بسرعة وعناية فائقة.' },
                        icon: 'Truck'
                    },
                    {
                        title: { en: 'Quality Guarantee', ar: 'ضمان الجودة' },
                        description: { en: 'Every product is verified for top-tier quality.', ar: 'يتم فحص كل منتج لضمان أعلى معايير الجودة.' },
                        icon: 'CheckCircle'
                    },
                    {
                        title: { en: '24/7 Support', ar: 'دعم فني 24/7' },
                        description: { en: 'Our team is here to help you anytime, anywhere.', ar: 'فريقنا متواجد لمساعدتك في أي وقت.' },
                        icon: 'Headphones'
                    }
                ]
            }
        },
        {
            id: 'products-1',
            type: 'ProductGrid',
            settings: {
                limit: 8,
                columns: 4
            },
            content: {
                title: { en: 'Featured Collection', ar: 'منتجات مختارة' },
                subtitle: { en: 'Hand-picked items just for you', ar: 'تم اختيارها بعناية لك' }
            }
        }
    ]
};

export const COMPONENT_DEFAULTS: Record<ComponentType, Partial<ComponentSchema>> = {
    Header: {
        type: 'Header',
        settings: {
            layout: 'center',
            sticky: true,
            backgroundColor: 'white'
        },
        content: {
            logo: '/placeholder-logo.png',
            storeName: { en: 'My Store', ar: 'متجري' },
            links: [
                { label: { en: 'Home', ar: 'الرئيسية' }, url: '/' },
                { label: { en: 'Products', ar: 'المنتجات' }, url: '/products' },
                { label: { en: 'About', ar: 'من نحن' }, url: '/about' }
            ]
        }
    },
    Footer: {
        type: 'Footer',
        settings: {
            backgroundColor: 'slate-900',
            textColor: 'white'
        },
        content: {
            copyright: { en: '© 2024 My Store. All rights reserved.', ar: '© 2024 متجري. جميع الحقوق محفوظة.' },
            links: [
                { label: { en: 'Privacy Policy', ar: 'سياسة الخصوصية' }, url: '/privacy' },
                { label: { en: 'Terms of Service', ar: 'شروط الخدمة' }, url: '/terms' }
            ],
            socials: { facebook: '#', instagram: '#', twitter: '#' }
        }
    },
    Hero: {
        type: 'Hero',
        settings: {
            height: 'large',
            align: 'center',
            overlayOpacity: 50
        },
        content: {
            title: { en: 'New Hero Section', ar: 'قسم رئيسي جديد' },
            subtitle: { en: 'Add a catchy subtitle here.', ar: 'أضف وصفاً جذاباً هنا.' },
            buttonText: { en: 'Shop Now', ar: 'تسوق الآن' },
            buttonLink: '#',
            backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200'
        }
    },
    Features: {
        type: 'Features',
        settings: {
            columns: 3,
            style: 'cards'
        },
        content: {
            features: [
                { title: { en: 'Feature 1', ar: 'ميزة 1' }, description: { en: 'Description 1', ar: 'وصف الميزة 1' }, icon: 'Star' },
                { title: { en: 'Feature 2', ar: 'ميزة 2' }, description: { en: 'Description 2', ar: 'وصف الميزة 2' }, icon: 'Truck' },
                { title: { en: 'Feature 3', ar: 'ميزة 3' }, description: { en: 'Description 3', ar: 'وصف الميزة 3' }, icon: 'Shield' }
            ]
        }
    },
    ProductGrid: {
        type: 'ProductGrid',
        settings: {
            limit: 8,
            columns: 4,
            categoryId: 'all'
        },
        content: {
            title: { en: 'New Product Collection', ar: 'مجموعة منتجات جديدة' },
            subtitle: { en: 'Check out our latest items', ar: 'اكتشف أحدث منتجاتنا' }
        }
    },
    Banner: {
        type: 'Banner',
        settings: {
            height: 'small',
            align: 'left'
        },
        content: {
            title: { en: 'Special Offer', ar: 'عرض خاص' },
            description: { en: 'Get 50% off on selected items.', ar: 'احصل على خصم 50% على منتجات مختارة.' },
            buttonText: { en: 'View Offer', ar: 'شاهد العرض' },
            buttonLink: '#offer',
            backgroundImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1200'
        }
    },
    Testimonials: {
        type: 'Testimonials',
        settings: {
            style: 'grid',
            columns: 3
        },
        content: {
            title: { en: 'What our customers say', ar: 'آراء عملائنا' },
            items: [
                { name: { en: 'John Doe', ar: 'أحمد محمد' }, role: { en: 'Customer', ar: 'عميل' }, text: { en: 'Great products!', ar: 'منتجات رائعة!' }, avatar: '' },
                { name: { en: 'Jane Smith', ar: 'سارة علي' }, role: { en: 'Customer', ar: 'عميل' }, text: { en: 'Fast shipping!', ar: 'شحن سريع!' }, avatar: '' },
                { name: { en: 'Bob Johnson', ar: 'خالد عمر' }, role: { en: 'Customer', ar: 'عميل' }, text: { en: 'Excellent support.', ar: 'دعم ممتاز.' }, avatar: '' }
            ]
        }
    },
    FAQ: {
        type: 'FAQ',
        settings: {},
        content: {
            title: { en: 'Frequently Asked Questions', ar: 'الأسئلة الشائعة' },
            items: [
                { question: { en: 'Shipping time?', ar: 'كم مدة الشحن؟' }, answer: { en: '2-3 days.', ar: '2-3 أيام عمل.' } },
                { question: { en: 'Return policy?', ar: 'سياسة الاسترجاع؟' }, answer: { en: '30 days.', ar: '30 يوماً.' } }
            ]
        }
    },
    RichText: {
        type: 'RichText',
        settings: { padding: 'medium' },
        content: { text: { en: '<h2>Rich Text Section</h2><p>Add your custom content here.</p>', ar: '<h2>قسم نصي</h2><p>أضف المحتوى الخاص بك هنا.</p>' } }
    },
    ContactForm: {
        type: 'ContactForm',
        settings: {
            backgroundColor: 'white'
        },
        content: {
            title: { en: 'Contact Us', ar: 'تواصل معنا' },
            description: { en: 'We would love to hear from you.', ar: 'نسعد بسماع آرائكم.' },
            emailPlaceholder: { en: 'Your Email', ar: 'بريدك الإلكتروني' },
            messagePlaceholder: { en: 'Your Message', ar: 'رسالتك' },
            buttonText: { en: 'Send Message', ar: 'إرسال الرسالة' }
        }
    },
    Newsletter: {
        type: 'Newsletter',
        settings: {
            backgroundColor: 'slate-900',
            textColor: 'white'
        },
        content: {
            title: { en: 'Subscribe to our newsletter', ar: 'اشترك في نشرتنا البريدية' },
            description: { en: 'Get the latest updates and offers.', ar: 'احصل على آخر التحديثات والعروض.' },
            placeholder: { en: 'Enter your email', ar: 'أدخل بريدك الإلكتروني' },
            buttonText: { en: 'Subscribe', ar: 'اشترك' }
        }
    },

    // Checkout Components
    CheckoutHeader: {
        type: 'CheckoutHeader',
        settings: {
            backgroundColor: 'white',
            showLockIcon: true
        },
        content: {
            logo: '/placeholder-logo.png',
            storeName: { en: 'My Store', ar: 'متجري' }
        }
    },
    CheckoutForm: {
        type: 'CheckoutForm',
        settings: {
            layout: 'default',
            inputStyle: 'outline',
            showLabels: true
        },
        content: {
            title: { en: 'Customer Information', ar: 'بيانات العميل' }
        }
    },
    OrderSummary: {
        type: 'OrderSummary',
        settings: {
            sticky: true,
            backgroundColor: 'slate-50'
        },
        content: {
            title: { en: 'Order Summary', ar: 'ملخص الطلب' }
        }
    },
    TrustBadges: {
        type: 'TrustBadges',
        settings: {
            align: 'center',
            style: 'color'
        },
        content: {
            badges: [
                { icon: 'Lock', label: { en: 'Secure Payment', ar: 'دفع آمن' } },
                { icon: 'ShieldCheck', label: { en: 'Data Protection', ar: 'حماية البيانات' } },
                { icon: 'Truck', label: { en: 'Fast Shipping', ar: 'شحن سريع' } }
            ]
        }
    },
    CountdownTimer: {
        type: 'CountdownTimer',
        settings: {
            durationMinutes: 10,
            backgroundColor: '#fef2f2', // red-50
            textColor: '#dc2626' // red-600
        },
        content: {
            message: { en: '🔥 High demand! Order reserved for:', ar: '🔥 طلب عالٍ! تم حجز طلبك لمدة:' }
        }
    },
    BumpOffer: {
        type: 'BumpOffer',
        settings: {
            price: 5,
            backgroundColor: '#fefce8', // yellow-50
            borderColor: '#facc15' // yellow-400
        },
        content: {
            title: { en: 'One-Time Offer', ar: 'عرض لمرة واحدة' },
            description: { en: 'Add Priority Processing for just {{price}}', ar: 'أضف خدمة التجهيز السريع مقابل {{price}} فقط' },
            productName: { en: 'Priority Processing', ar: 'تجهيز سريع' }
        }
    },
    SocialProof: {
        type: 'SocialProof',
        settings: {
            position: 'bottom-left',
            delay: 5000
        },
        content: {
            messages: [
                { en: 'Someone from Riyadh just bought this', ar: 'شخص من الرياض قام بالشراء للتو' },
                { en: '15 people are viewing this right now', ar: '15 شخص يشاهدون هذا المنتج الآن' }
            ]
        }
    },
    ExitIntentPopup: {
        type: 'ExitIntentPopup',
        settings: {
            discountCode: 'SAVE10',
            discountAmount: '10%'
        },
        content: {
            title: { en: 'Wait! Don\'t go yet', ar: 'انتظر! لا تذهب يرحل' },
            description: { en: 'Complete your order now and get 10% OFF', ar: 'أكمل طلبك الآن واحصل على خصم 10%' },
            buttonText: { en: 'Apply Discount', ar: 'طبق الخصم' }
        }
    }
};
