"use client";

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Star, ShieldCheck, Zap, Check } from 'lucide-react';
import Link from 'next/link';

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

interface ElegantTemplateProps {
    content: LandingContent;
    product: ProductData;
    language: 'ar' | 'en';
    storeSlug: string;
    productId: string;
    isPreview?: boolean;
}

export function ElegantTemplate({ content, product, language, storeSlug, productId, isPreview = false }: ElegantTemplateProps) {
    const isRTL = language === 'ar';
    const accent = content.accent_color || '#B8860B';

    const headline = content.headline?.[language] || product.name?.[language] || (language === 'ar' ? 'منتج حصري' : 'Exclusive Product');
    const subheadline = content.subheadline?.[language] || '';
    const ctaText = content.cta_text?.[language] || (language === 'ar' ? 'اطلب الآن' : 'Order Now');
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
        <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[#FAF8F5] text-gray-900 overflow-x-hidden" style={{ fontFamily: "'Playfair Display', 'Cairo', Georgia, serif" }}>

            {/* Top thin accent bar */}
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accent}, #D4AF37, ${accent})` }} />

            {/* Hero Section - Luxury Centered Layout */}
            <section className="relative pt-20 pb-32 px-6 overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-white rounded-full blur-[120px] opacity-20 -z-10" />
                
                <div className="max-w-4xl mx-auto text-center space-y-12">
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-10 duration-1000">
                        <Badge variant="outline" className="px-6 py-1.5 rounded-full border-primary/20 text-primary font-bold tracking-widest uppercase text-[10px]">
                            {language === 'ar' ? 'إصدار حصري' : 'Exclusive Edition'}
                        </Badge>
                        <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-[1.1]" style={{ color: accent }}>
                            {headline}
                        </h1>
                        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed italic">
                            {subheadline}
                        </p>
                    </div>

                    {/* Main Image with Frame */}
                    <div className="relative group max-w-2xl mx-auto animate-in zoom-in duration-1000 delay-300">
                        <div className="absolute -inset-4 bg-gradient-to-b from-primary/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" style={{ background: `${accent}10` }} />
                        <div className="relative p-2 bg-white rounded-[3rem] shadow-2xl border border-gray-100">
                            {selectedImage && (
                                <img
                                    src={selectedImage}
                                    alt={headline}
                                    className="w-full aspect-square object-cover rounded-[2.5rem] shadow-inner transition-transform duration-700 group-hover:scale-[1.02]"
                                />
                            )}
                            
                            {/* Floating Price Tag */}
                            <div className="absolute -bottom-6 right-1/2 translate-x-1/2 md:translate-x-0 md:-right-6 bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 min-w-[180px] animate-bounce">
                                <div className="text-center">
                                    {originalPrice && originalPrice > 0 && (
                                        <div className="text-sm text-gray-400 line-through mb-1">{originalPrice} {product.currency}</div>
                                    )}
                                    <div className="text-3xl font-black" style={{ color: accent }}>
                                        {finalPrice} <span className="text-sm opacity-60">{product.currency}</span>
                                    </div>
                                    <div className="mt-1 text-[9px] uppercase tracking-tighter font-black text-primary opacity-50">
                                        {language === 'ar' ? 'سعر العرض المحدود' : 'Limited Time Offer'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gallery Thumbnails */}
                    {product.images.length > 1 && (
                        <div className="flex flex-wrap justify-center gap-4 pt-10">
                            {product.images.map((img, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setSelectedImage(img)}
                                    className={cn(
                                        "w-16 h-16 rounded-2xl border-2 transition-all duration-300 overflow-hidden shadow-sm hover:scale-110",
                                        selectedImage === img ? "border-primary shadow-lg scale-110" : "border-transparent opacity-60 hover:opacity-100"
                                    )}
                                    style={{ borderColor: selectedImage === img ? accent : 'transparent' }}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Main CTA */}
                    <div className="pt-10 flex flex-col items-center gap-6">
                        <Button
                            onClick={handleBuyNow}
                            size="lg"
                            className="h-16 px-16 rounded-full text-xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95 group overflow-hidden relative"
                            style={{ backgroundColor: accent }}
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                {ctaText}
                                <Zap className="w-6 h-6 fill-white animate-pulse" />
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </Button>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                            {language === 'ar' ? 'دفع عند الاستلام وآمن 100%' : '100% Secure & COD available'}
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            {benefits.length > 0 && (
                <section className="py-24 bg-white">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {benefits.map((b, i) => (
                                <div key={i} className="text-center space-y-4 group">
                                    <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-2xl transition-transform group-hover:rotate-12" style={{ background: `${accent}10`, color: accent }}>
                                        <Check className="w-8 h-8" />
                                    </div>
                                    <p className="text-gray-600 font-medium leading-relaxed">{b[language]}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials */}
            {testimonials.length > 0 && (
                <section className="py-24 bg-[#FAF8F5]">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-3xl font-black uppercase tracking-widest" style={{ color: accent }}>
                                {language === 'ar' ? 'ماذا يقول عملاؤنا' : 'Customer Testimonials'}
                            </h2>
                            <div className="h-1 w-20 bg-gray-200 mx-auto rounded-full" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {testimonials.map((t, i) => (
                                <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
                                    <div className="flex gap-1">
                                        {Array.from({ length: 5 }).map((_, s) => (
                                            <Star key={s} className={cn("w-4 h-4", s < t.rating ? "fill-current" : "text-gray-200")} style={{ color: s < t.rating ? accent : undefined }} />
                                        ))}
                                    </div>
                                    <p className="text-lg text-gray-700 italic leading-relaxed">"{t.text[language]}"</p>
                                    <div className="flex items-center gap-4 pt-4">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: accent }}>
                                            {t.name[0]}
                                        </div>
                                        <span className="font-bold text-gray-900">{t.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Guarantee */}
            {guarantee && (
                <section className="py-24 bg-white border-y border-gray-100">
                    <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
                        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl shadow-xl" style={{ background: `linear-gradient(135deg, ${accent}, #D4AF37)` }}>
                            🛡️
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black">{language === 'ar' ? 'ضمان الرضا والجودة' : 'Satisfaction & Quality Guarantee'}</h3>
                            <p className="text-gray-500 text-lg leading-relaxed">{guarantee}</p>
                        </div>
                    </div>
                </section>
            )}

            {/* Bottom accent bar */}
            <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${accent}, #D4AF37, ${accent})` }} />
        </div>
    );
}
