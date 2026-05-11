"use client";

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Zap, Star, ShieldCheck, Timer, TrendingUp, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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

interface FlashTemplateProps {
    content: LandingContent;
    product: ProductData;
    language: 'ar' | 'en';
    storeSlug: string;
    productId: string;
    isPreview?: boolean;
    forceMobile?: boolean;
}

export function FlashTemplate({
    content,
    product,
    language,
    storeSlug,
    productId,
    isPreview = false,
    forceMobile = false
}: FlashTemplateProps) {
    const { addToCart } = useCart();
    const router = useRouter();
    const isRTL = language === 'ar';
    const accent = content.accent_color || '#FF0000';
    
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
    const discount = originalPrice ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100) : null;

    const headline = content.headline?.[language] || product.name[language];
    const subheadline = content.subheadline?.[language] || (language === 'ar' ? 'عرض حصري لفترة محدودة جداً' : 'Exclusive limited time offer');
    const ctaText = content.cta_text?.[language] || (language === 'ar' ? 'اشتر الآن قبل انتهاء العرض' : 'Buy Now Before Offer Ends');

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-black text-white flex flex-col font-sans">
            {/* Top Urgency Bar */}
            <div className="bg-yellow-400 text-black py-2 px-4 text-center font-black text-xs uppercase tracking-tighter flex items-center justify-center gap-4">
                <Timer className="w-4 h-4 animate-pulse" />
                <span>{language === 'ar' ? 'ينتهي العرض قريباً جداً! سارع بالطلب' : 'OFFER ENDS SOON! HURRY UP'}</span>
                <Timer className="w-4 h-4 animate-pulse" />
            </div>

            {/* Hero Section */}
            <header className="relative pt-12 pb-24 px-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="max-w-5xl mx-auto relative z-10 text-center">
                    {discount && (
                        <div className="inline-block bg-red-600 text-white px-6 py-2 rounded-full font-black text-xl italic mb-6 animate-bounce shadow-[0_10px_30px_rgba(220,38,38,0.5)]">
                            {language === 'ar' ? `خصم ${discount}% اليوم فقط` : `SAVE ${discount}% TODAY ONLY`}
                        </div>
                    )}
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.1]">
                        {headline}
                    </h1>
                    <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-12 font-medium">
                        {subheadline}
                    </p>

                    <div className="relative max-w-3xl mx-auto group">
                        <div className="absolute inset-0 bg-red-600/10 blur-[60px] group-hover:bg-red-600/20 transition-all" />
                        <div className="relative aspect-square md:aspect-video rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                            <img 
                                src={content.hero_image || product.images[0]} 
                                alt="" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Flash Stats */}
            <section className="py-12 bg-zinc-900 border-y border-white/5">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex items-center gap-4 p-6 rounded-3xl bg-white/5">
                            <TrendingUp className="w-10 h-10 text-red-500" />
                            <div>
                                <div className="text-2xl font-black">4.9/5</div>
                                <div className="text-xs text-white/50 uppercase">{language === 'ar' ? 'تقييم العملاء' : 'Customer Rating'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-6 rounded-3xl bg-white/5">
                            <Star className="w-10 h-10 text-yellow-400 fill-yellow-400" />
                            <div>
                                <div className="text-2xl font-black">10,000+</div>
                                <div className="text-xs text-white/50 uppercase">{language === 'ar' ? 'عميل سعيد' : 'Happy Customers'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-6 rounded-3xl bg-white/5">
                            <ShieldCheck className="w-10 h-10 text-green-500" />
                            <div>
                                <div className="text-2xl font-black">100%</div>
                                <div className="text-xs text-white/50 uppercase">{language === 'ar' ? 'ضمان جودة' : 'Quality Guarantee'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Grid Sections */}
            {((content.product_sections || []).length > 0 || product.images.length > 1) && (
                <section className="py-24 px-6 bg-black relative">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-black uppercase mb-4">{language === 'ar' ? 'لماذا تختار هذا المنتج؟' : 'Why Choose This Product?'}</h2>
                            <div className="h-1.5 w-24 bg-red-600 mx-auto" />
                        </div>
                        <div className={cn(
                            "grid gap-8 md:gap-10",
                            forceMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                        )}>
                            {((content.product_sections || []).length > 0 ? content.product_sections! : product.images.slice(1).map(img => ({
                                image: img,
                                title: { ar: 'ميزة جبارة', en: 'Powerful Feature' },
                                description: { ar: 'وصف دقيق للميزة وكيفية استفادة العميل منها لزيادة الثقة.', en: 'Detailed feature description and customer benefit to build trust.' }
                            }))).map((section, idx) => (
                                <div key={idx} className="bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-red-600/50 transition-all flex flex-col">
                                    <div className="aspect-square overflow-hidden relative">
                                        <img src={section.image} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />
                                    </div>
                                    <div className="p-8 space-y-4 flex-1">
                                        <h3 className="text-xl font-black uppercase tracking-tighter text-red-500">{section.title[language]}</h3>
                                        <p className="text-white/60 text-[10px] leading-relaxed">
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
                <section className="py-24 px-6 bg-zinc-900">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-4xl font-black text-center mb-16 uppercase">{language === 'ar' ? 'ماذا يقول العملاء' : 'Customer Voice'}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {content.testimonials.map((t, i) => (
                                <div key={i} className="bg-black p-8 rounded-[2rem] border border-white/5">
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                                    </div>
                                    <p className="text-lg italic mb-6 text-white/80">"{t.text[language]}"</p>
                                    <div className="font-bold text-red-500">{t.name}</div>
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
                        className="w-full h-16 rounded-2xl text-white font-black text-xl shadow-[0_20px_50px_rgba(220,38,38,0.5)] transition-all hover:scale-105 active:scale-95 group overflow-hidden border border-white/20"
                        style={{ backgroundColor: accent }}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                        <span className="flex items-center justify-between w-full px-8 relative z-10">
                            <span className="flex items-center gap-3">
                                <ShoppingCart className="w-6 h-6 animate-bounce" />
                                {ctaText}
                            </span>
                            <span className="bg-black/20 px-4 py-1 rounded-xl text-sm">
                                {finalPrice} {product.currency}
                            </span>
                        </span>
                    </Button>
                </div>
            </div>

            <footer className="py-12 pb-32 border-t border-white/5 text-center text-white/30 text-[10px] uppercase font-bold tracking-widest">
                {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'} © 2026
            </footer>
        </div>
    );
}
