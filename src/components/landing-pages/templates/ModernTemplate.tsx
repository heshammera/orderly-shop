"use client";

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, ShieldCheck, Check, Sparkles, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';

interface ProductData {
    name: { ar: string; en: string };
    price: number;
    sale_price?: number;
    currency: string;
    images: string[];
}

interface LandingContent {
    headline?: { ar: string; en: string };
    subheadline?: { ar: string; en: string };
    cta_text?: { ar: string; en: string };
    benefits?: Array<{ ar: string; en: string }>;
    guarantee_text?: { ar: string; en: string };
    testimonials?: Array<{ name: string; text: { ar: string; en: string }; rating: number }>;
    hero_image?: string;
    accent_color?: string;
    product_sections?: Array<{
        image: string;
        title: { ar: string; en: string };
        description: { ar: string; en: string };
    }>;
}

interface ModernTemplateProps {
    content: LandingContent;
    product: ProductData;
    language: 'ar' | 'en';
    storeSlug: string;
    productId: string;
    isPreview?: boolean;
    forceMobile?: boolean;
}

export function ModernTemplate({
    content,
    product,
    language,
    storeSlug,
    productId,
    isPreview = false,
    forceMobile = false
}: ModernTemplateProps) {
    const { addToCart } = useCart();
    const router = useRouter();
    const isRTL = language === 'ar';
    const accent = content.accent_color || '#000000';
    
    const handleBuyNow = async () => {
        if (isPreview) return;
        await addToCart({
            productId,
            productName: product.name,
            productImage: content.hero_image || product.images[0],
            basePrice: product.price,
            unitPrice: product.sale_price || product.price,
            quantity: 1,
            variants: [],
            addedAt: new Date().toISOString()
        }, { skipOpen: true });
        router.push(`/checkout`);
    };

    const finalPrice = product.sale_price || product.price;
    const originalPrice = product.sale_price ? product.price : null;

    const headline = content.headline?.[language] || product.name[language];
    const subheadline = content.subheadline?.[language] || (language === 'ar' ? 'الجيل الجديد من الجودة والابتكار' : 'The next generation of quality and innovation');
    const ctaText = content.cta_text?.[language] || (language === 'ar' ? 'اطلب الآن مجاناً' : 'Order Now for Free');

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-black selection:text-white">
            {/* Header / Nav */}
            <nav className="h-20 flex items-center justify-center border-b bg-white/50 backdrop-blur-md sticky top-0 z-[60]">
                <div className="text-xl font-black tracking-tighter uppercase">{storeSlug}</div>
            </nav>

            {/* Hero Section */}
            <header className="py-24 px-6 bg-white overflow-hidden">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className={cn("space-y-8", isRTL ? "text-right" : "text-left")}>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 text-zinc-600 text-xs font-bold uppercase tracking-wider">
                            <Sparkles className="w-3 h-3" />
                            {language === 'ar' ? 'تصميم حصري 2026' : 'Exclusive Design 2026'}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight">
                            {headline}
                        </h1>
                        <p className="text-xl text-zinc-500 leading-relaxed max-w-lg">
                            {subheadline}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Button 
                                onClick={handleBuyNow}
                                className="h-14 px-10 rounded-full font-bold text-lg transition-transform hover:scale-105 active:scale-95 shadow-xl"
                                style={{ backgroundColor: accent }}
                            >
                                {ctaText} <ArrowRight className={cn("w-5 h-5 ml-2", isRTL && "rotate-180")} />
                            </Button>
                        </div>
                        <div className="flex items-center gap-6 pt-4 border-t border-zinc-100">
                            <div className="flex -space-x-3">
                                {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-zinc-200" />)}
                            </div>
                            <div className="text-sm font-medium text-zinc-400">
                                <span className="font-bold text-zinc-900">+10k</span> {language === 'ar' ? 'مستخدم يثقون بنا' : 'users trust us'}
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-zinc-200 blur-3xl rounded-full scale-75 opacity-50" />
                        <div className="relative rounded-[3rem] overflow-hidden shadow-2xl bg-white border">
                            <img 
                                src={content.hero_image || product.images[0]} 
                                alt="" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Bar */}
            <div className="bg-zinc-900 text-white py-10 px-6 overflow-hidden">
                <div className="max-w-6xl mx-auto flex flex-wrap justify-between gap-8 opacity-80">
                    <div className="flex items-center gap-3"><Check className="w-5 h-5" /> {language === 'ar' ? 'جودة فاخرة' : 'Premium Quality'}</div>
                    <div className="flex items-center gap-3"><Check className="w-5 h-5" /> {language === 'ar' ? 'شحن سريع' : 'Fast Shipping'}</div>
                    <div className="flex items-center gap-3"><Check className="w-5 h-5" /> {language === 'ar' ? 'ضمان عام' : 'One Year Warranty'}</div>
                    <div className="flex items-center gap-3"><Check className="w-5 h-5" /> {language === 'ar' ? 'دفع آمن' : 'Secure Payment'}</div>
                </div>
            </div>

            {/* Product Grid Sections */}
            {((content.product_sections || []).length > 0 || product.images.length > 1) && (
                <section className="py-32 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {((content.product_sections || []).length > 0 ? content.product_sections! : product.images.slice(1).map(img => ({
                                image: img,
                                title: { ar: 'بساطة وأناقة', en: 'Simple & Elegant' },
                                description: { ar: 'وصف دقيق للميزة وكيفية استفادة العميل منها لزيادة الثقة.', en: 'Detailed feature description and customer benefit to build trust.' }
                            }))).map((section, idx) => (
                                <div key={idx} className="space-y-6 group flex flex-col">
                                    <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-white border border-zinc-100 shadow-sm transition-shadow group-hover:shadow-xl">
                                        <img src={section.image} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <h3 className="text-xl font-bold tracking-tight">{section.title[language]}</h3>
                                        <p className="text-zinc-500 text-sm leading-relaxed">
                                            {section.description[language]}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials */}
            {content.testimonials && content.testimonials.length > 0 && (
                <section className="py-32 px-6 bg-zinc-100 rounded-[4rem]">
                    <div className="max-w-4xl mx-auto">
                        <div className="space-y-16">
                            {content.testimonials.map((t, i) => (
                                <div key={i} className="text-center space-y-8">
                                    <div className="flex justify-center gap-1">
                                        {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-zinc-900 text-zinc-900" />)}
                                    </div>
                                    <blockquote className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                                        "{t.text[language]}"
                                    </blockquote>
                                    <cite className="not-italic font-bold text-zinc-400 block uppercase tracking-widest text-sm">— {t.name}</cite>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Sticky Buy Button */}
            <div className="fixed bottom-0 inset-x-0 z-[100] p-4 flex justify-center pointer-events-none">
                <div className="max-w-md w-full pointer-events-auto animate-in slide-in-from-bottom-10 duration-500">
                    <Button 
                        onClick={handleBuyNow}
                        className="w-full h-16 rounded-full text-white font-bold text-lg shadow-2xl transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-between px-8 border-4 border-white"
                        style={{ backgroundColor: accent }}
                    >
                        <span className="flex items-center gap-3">
                            <ShoppingBag className="w-5 h-5" />
                            {ctaText}
                        </span>
                        <span className="bg-white/20 px-4 py-1 rounded-full text-sm">
                            {finalPrice} {product.currency}
                        </span>
                    </Button>
                </div>
            </div>

            <footer className="py-20 pb-40 text-center text-zinc-300 text-sm font-medium">
                © 2026 {storeSlug}. {language === 'ar' ? 'بكل حب من أجل راحتك' : 'Made with love for you'}
            </footer>
        </div>
    );
}
