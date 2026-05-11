"use client";

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Star, ShieldCheck, Zap, Check, ChevronLeft, ChevronRight } from 'lucide-react';

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
    product_sections?: Array<{
        image: string;
        title: { ar: string; en: string };
        description: { ar: string; en: string };
    }>;
}

interface ProductData {
    name: { ar: string; en: string };
    price: number;
    sale_price?: number;
    currency: string;
    images: string[];
}

interface NoirTemplateProps {
    content: LandingContent;
    product: ProductData;
    language: 'ar' | 'en';
    storeSlug: string;
    productId: string;
    isPreview?: boolean;
    forceMobile?: boolean;
}

export function NoirTemplate({ content, product, language, storeSlug, productId, isPreview = false, forceMobile = false }: NoirTemplateProps) {
    const isRTL = language === 'ar';
    const accent = content.accent_color || '#D4AF37'; // Gold

    const headline = content.headline?.[language] || product.name?.[language] || (language === 'ar' ? 'منتج حصري' : 'Exclusive Product');
    const subheadline = content.subheadline?.[language] || '';
    const ctaText = content.cta_text?.[language] || (language === 'ar' ? 'اقتنِ الآن' : 'Order Now');
    const benefits = content.benefits || [];
    const guarantee = content.guarantee_text?.[language] || '';
    const testimonials = content.testimonials || [];
    const heroImage = content.hero_image || (product.images && product.images[0]) || '';
    
    const [selectedImage, setSelectedImage] = useState(heroImage);
    const finalPrice = product.sale_price || product.price || 0;
    const originalPrice = product.sale_price ? (product.price || null) : null;

    const { addToCart } = useCart();
    const router = useRouter();

    const handleBuyNow = async () => {
        if (isPreview) return;
        
        await addToCart({
            productId,
            productName: product.name,
            productImage: heroImage,
            basePrice: product.price,
            unitPrice: finalPrice,
            quantity: 1,
            variants: [], 
            addedAt: new Date().toISOString()
        }, { skipOpen: true });

        router.push(`/checkout`);
    };

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[#0a0a0a] text-zinc-300 overflow-x-hidden selection:bg-amber-500/30">
            {/* Elegant Header */}
            <header className="py-8 px-6 flex justify-center border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xl font-serif tracking-[0.3em] text-white uppercase italic">{language === 'ar' ? 'مجموعة النخبة' : 'Elite Collection'}</span>
                    <div className="h-[1px] w-12" style={{ backgroundColor: accent }}></div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-16 pb-24 px-6">
                {/* Decorative background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none" 
                    style={{ backgroundColor: `${accent}0D` }} />

                <div className={cn(
                    "max-w-6xl mx-auto grid gap-16 items-center",
                    forceMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
                )}>
                    {/* Visual Side */}
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-10 duration-1000">
                        <div className="relative group aspect-square rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl">
                            <img 
                                src={selectedImage} 
                                alt={headline} 
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                        
                        {/* Gallery */}
                        {product.images.length > 1 && (
                            <div className="flex gap-3 justify-center lg:justify-start">
                                {product.images.map((img, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setSelectedImage(img)}
                                        className={cn(
                                            "w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-500",
                                            selectedImage === img ? "scale-105" : "border-zinc-800 opacity-50 hover:opacity-100"
                                        )}
                                        style={{ borderColor: selectedImage === img ? accent : 'transparent' }}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Side */}
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-1000 delay-300">
                        <div className="space-y-6">
                            <Badge variant="outline" className="text-[10px] tracking-[0.4em] uppercase border-zinc-800 text-zinc-500 px-4 py-1.5 rounded-full">
                                {language === 'ar' ? 'إصدار محدود' : 'Limited Release'}
                            </Badge>
                            <h1 className={cn(
                                "font-serif text-white leading-tight italic",
                                forceMobile ? "text-3xl" : "text-3xl md:text-6xl"
                            )}>
                                {headline}
                            </h1>
                            <p className="text-base md:text-lg text-zinc-500 leading-relaxed max-w-lg">
                                {subheadline}
                            </p>
                        </div>

                        <div className="flex items-baseline gap-4 border-b border-zinc-900 pb-8">
                            <div className="text-4xl md:text-5xl font-light" style={{ color: accent }}>
                                {finalPrice} <span className="text-sm uppercase tracking-widest opacity-50">{product.currency}</span>
                            </div>
                            {originalPrice && (
                                <div className="text-lg md:text-xl text-zinc-700 line-through">
                                    {originalPrice} {product.currency}
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <Button 
                                onClick={handleBuyNow}
                                size="lg"
                                className="w-full h-16 rounded-none text-black font-black tracking-[0.2em] uppercase text-sm shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-1"
                                style={{ backgroundColor: accent }}
                            >
                                {ctaText}
                            </Button>
                            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-[10px] tracking-[0.2em] uppercase text-zinc-600">
                                <span className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" style={{ color: accent }} />
                                    {language === 'ar' ? 'ضمان ممتد' : 'Extended Warranty'}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Zap className="w-4 h-4" style={{ color: accent }} />
                                    {language === 'ar' ? 'شحن سريع' : 'Priority Shipping'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Grid Sections */}
            {((content.product_sections || []).length > 0 || product.images.length > 1) && (
                <section className="py-24 px-6 bg-[#050505]">
                    <div className="max-w-7xl mx-auto">
                        <div className={cn(
                            "grid gap-8 md:gap-12",
                            forceMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                        )}>
                            {((content.product_sections || []).length > 0 ? content.product_sections! : product.images.slice(1).map(img => ({
                                image: img,
                                title: { ar: 'ميزة حصرية', en: 'Exclusive Feature' },
                                description: { ar: 'وصف دقيق للميزة وكيفية استفادة العميل منها لزيادة الثقة.', en: 'Detailed feature description and customer benefit to build trust.' }
                            }))).map((section, idx) => (
                                <div key={idx} className="space-y-6 group flex flex-col">
                                    <div className="aspect-[4/5] overflow-hidden rounded-sm border border-zinc-900 relative">
                                        <img src={section.image} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        <h3 className="text-xl font-serif italic text-white">{section.title[language]}</h3>
                                        <p className="text-zinc-500 leading-relaxed text-[10px] border-s border-zinc-800 ps-4">
                                            {section.description[language]}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Benefits - Dark Minimalist */}
            {benefits.length > 0 && (
                <section className="py-32 bg-zinc-950 border-y border-zinc-900">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className={cn(
                            "grid gap-16",
                            forceMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
                        )}>
                            {benefits.map((b, i) => (
                                <div key={i} className="space-y-6 group">
                                    <div className="text-zinc-800 text-6xl font-serif italic group-hover:opacity-40 transition-all duration-700" 
                                        style={{ color: i === 0 ? accent : undefined }}>0{i+1}</div>
                                    <h3 className="text-xl text-white font-serif italic">{language === 'ar' ? 'الميزة الاستثنائية' : 'Exceptional Feature'}</h3>
                                    <p className="text-zinc-500 leading-relaxed text-sm">{b[language]}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials - Noir Style */}
            {testimonials.length > 0 && (
                <section className="py-32 px-6">
                    <div className="max-w-4xl mx-auto text-center space-y-20">
                        <h2 className="text-2xl font-serif italic tracking-[0.3em] uppercase text-zinc-500">
                            {language === 'ar' ? 'صدى الفخامة' : 'Echoes of Excellence'}
                        </h2>
                        
                        <div className="grid grid-cols-1 gap-16">
                            {testimonials.slice(0, 2).map((t, i) => (
                                <div key={i} className="space-y-8 animate-in fade-in duration-1000">
                                    <div className="flex justify-center gap-1">
                                        {Array.from({ length: 5 }).map((_, s) => (
                                            <Star key={s} className={cn("w-3 h-3", s < t.rating ? "fill-current" : "text-zinc-800")} style={{ color: s < t.rating ? accent : undefined }} />
                                        ))}
                                    </div>
                                    <p className="text-xl md:text-3xl font-serif italic text-zinc-300 leading-relaxed">
                                        "{t.text[language]}"
                                    </p>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-sm font-bold tracking-[0.3em] uppercase text-white">{t.name}</span>
                                        <div className="h-[1px] w-8" style={{ backgroundColor: accent, opacity: 0.3 }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Guarantee - Full Screen Call to Action */}
            <section className="py-40 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] bg-fixed flex flex-col items-center text-center px-6 gap-12">
                <div className="w-20 h-20 rounded-full border border-amber-500/30 flex items-center justify-center text-3xl shadow-[0_0_40px_rgba(212,175,55,0.1)]">
                    ⚜️
                </div>
                <div className="max-w-2xl space-y-6">
                    <h3 className="text-3xl font-serif italic text-white">{language === 'ar' ? 'وعدنا لك' : 'Our Promise to You'}</h3>
                    <p className="text-zinc-500 leading-relaxed italic">{guarantee}</p>
                </div>
                <Button 
                    onClick={handleBuyNow}
                    size="lg"
                    className="rounded-none px-12 h-14 text-black hover:opacity-90 transition-all font-bold uppercase tracking-widest text-xs"
                    style={{ backgroundColor: accent }}
                >
                    {ctaText}
                </Button>
            </section>

            {/* Sticky Buy Button */}
            <div className="fixed bottom-0 inset-x-0 z-[100] p-4 flex justify-center pointer-events-none">
                <div className="max-w-md w-full pointer-events-auto animate-in slide-in-from-bottom-10 duration-500">
                    <Button 
                        onClick={handleBuyNow}
                        className="w-full h-16 rounded-none text-black font-black tracking-[0.2em] uppercase text-sm shadow-[0_30px_60px_rgba(0,0,0,0.8)] transition-all hover:-translate-y-1 border border-white/5"
                        style={{ backgroundColor: accent }}
                    >
                        <span className="flex items-center justify-between w-full px-8">
                            <span className="flex items-center gap-3">
                                <Zap className="w-4 h-4 fill-current" />
                                {ctaText}
                            </span>
                            <span className="opacity-60">|</span>
                            <span>{finalPrice} {product.currency}</span>
                        </span>
                    </Button>
                </div>
            </div>

            {/* Elegant Footer */}
            <footer className="py-12 pb-32 border-t border-zinc-900 bg-zinc-950 flex justify-center">
                <span className="text-[10px] tracking-[0.5em] text-zinc-700 uppercase">Noir Luxury Experience</span>
            </footer>
        </div>
    );
}
