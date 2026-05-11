"use client";

import { useState, useEffect, useMemo } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
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
}

interface ProductData {
    name: { ar: string; en: string };
    price: number;
    sale_price?: number;
    currency: string;
    images: string[];
}

interface HypeTemplateProps {
    content: LandingContent;
    product: ProductData;
    language: 'ar' | 'en';
    storeSlug: string;
    productId: string;
    isPreview?: boolean;
}

export function HypeTemplate({ content, product, language, storeSlug, productId, isPreview = false }: HypeTemplateProps) {
    const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 34, seconds: 47 });
    const [visitorCount, setVisitorCount] = useState(25);
    const heroImage = content.hero_image || (product.images && product.images[0]) || '';
    const [selectedImage, setSelectedImage] = useState(heroImage);
    const isRTL = language === 'ar';
    const accent = content.accent_color || '#8B5CF6';

    // Restored Timers with stability
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                let { hours, minutes, seconds } = prev;
                seconds--;
                if (seconds < 0) { seconds = 59; minutes--; }
                if (minutes < 0) { minutes = 59; hours--; }
                if (hours < 0) return { hours: 0, minutes: 0, seconds: 0 };
                return { hours, minutes, seconds };
            });
        }, 1000);
        
        const vTimer = setInterval(() => {
            setVisitorCount(prev => {
                const next = prev + (Math.random() > 0.5 ? 1 : -1);
                return next < 10 ? 10 : next > 100 ? 100 : next;
            });
        }, 4000);

        return () => { clearInterval(timer); clearInterval(vTimer); };
    }, []);

    const pad = (n: number) => String(n).padStart(2, '0');

    // Safe Data
    const headline = content.headline?.[language] || product.name?.[language] || '';
    const subheadline = content.subheadline?.[language] || '';
    const ctaText = content.cta_text?.[language] || (language === 'ar' ? 'اطلب الآن' : 'Order Now');
    const benefits = content.benefits || [];
    const guarantee = content.guarantee_text?.[language] || '';
    const testimonials = content.testimonials || [];
    
    const finalPrice = Number(product.sale_price || product.price || 0);
    const originalPrice = product.sale_price ? Number(product.price || 0) : null;
    const discount = 0; // Temporarily disabled to kill "â" error

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
            variants: [], // Default to no variants for LP for now
            addedAt: new Date().toISOString()
        }, { skipOpen: true });

        router.push(`/checkout`);
    };

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-black text-white font-sans overflow-x-hidden" style={{ fontFamily: "'Inter', 'Cairo', sans-serif" }}>
            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-20 blur-3xl"
                    style={{ background: `radial-gradient(circle, ${accent}, transparent)` }} />
            </div>

            {/* Visitor counter bar */}
            <div className="relative z-10 py-2 text-center text-xs font-medium border-b border-white/10"
                style={{ background: `linear-gradient(90deg, transparent, ${accent}22, transparent)` }}>
                <span className="animate-pulse">🔴</span>
                {' '}
                {language === 'ar'
                    ? `${visitorCount} شخص يشاهد هذا المنتج الآن`
                    : `${visitorCount} people viewing this right now`}
            </div>

            {/* Hero Section */}
            <section className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center px-4 py-16 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border"
                    style={{ borderColor: accent, color: accent, background: `${accent}15` }}>
                    <span>⚡</span>
                    {language === 'ar' ? 'عرض محدود الوقت' : 'Limited Time Offer'}
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-tight mb-4 max-w-4xl">
                    <span style={{
                        background: `linear-gradient(135deg, #fff 40%, ${accent})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        {headline}
                    </span>
                </h1>

                {subheadline && <p className="text-lg sm:text-xl text-white/60 mb-8 max-w-2xl leading-relaxed">{subheadline}</p>}

                {/* Countdown */}
                <div className="flex items-center gap-3 mb-8">
                    {[
                        { val: pad(timeLeft.hours), label: language === 'ar' ? 'ساعة' : 'HRS' },
                        { val: pad(timeLeft.minutes), label: language === 'ar' ? 'دقيقة' : 'MIN' },
                        { val: pad(timeLeft.seconds), label: language === 'ar' ? 'ثانية' : 'SEC' }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div className="text-2xl sm:text-4xl font-black tabular-nums">{item.val}</div>
                                <div className="text-[10px] opacity-40 font-bold uppercase">{item.label}</div>
                            </div>
                            {i < 2 && <span className="text-2xl font-bold mx-2" style={{ color: accent }}>:</span>}
                        </div>
                    ))}
                </div>

                {/* Image Gallery & Price */}
                <div className="relative mb-8 group max-w-2xl w-full flex flex-col items-center">
                    {/* Main Image */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 rounded-2xl blur-3xl opacity-30 scale-95 transition-all group-hover:opacity-50"
                            style={{ background: `radial-gradient(circle, ${accent}, transparent)` }} />
                        <img 
                            src={selectedImage || heroImage} 
                            alt={headline} 
                            className="relative w-72 h-72 sm:w-96 sm:h-96 object-cover rounded-3xl border border-white/10 shadow-2xl transition-all duration-500" 
                        />
                        
                        {discount > 0 && (
                            <div className="absolute -top-4 -start-4 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xs text-center shadow-lg transform -rotate-12 z-20"
                                style={{ background: `linear-gradient(135deg, ${accent}, #ef4444)` }}>
                                <div>
                                    <div className="text-[10px] opacity-80">{language === 'ar' ? 'خصم' : 'SALE'}</div>
                                    <div className="text-sm font-black">{discount}%</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {product.images && product.images.length > 1 && (
                        <div className="flex gap-3 px-4 py-2 overflow-x-auto no-scrollbar max-w-full">
                            {product.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(img)}
                                    className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                                        selectedImage === img ? 'border-white scale-110 shadow-lg' : 'border-white/10 opacity-50 hover:opacity-100'
                                    }`}
                                    style={{ borderColor: selectedImage === img ? accent : undefined }}
                                >
                                    <img src={img} className="w-full h-full object-cover" alt="" />
                                    {selectedImage === img && (
                                        <div className="absolute inset-0 bg-white/10" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4 mb-6">
                    {originalPrice && <span className="text-xl text-white/30 line-through">{originalPrice} {product.currency}</span>}
                    <span className="text-4xl font-black" style={{ color: accent }}>{finalPrice} {product.currency}</span>
                </div>

                <button 
                    onClick={handleBuyNow}
                    disabled={isPreview}
                    className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-black text-lg transition-all hover:scale-105 active:scale-95 disabled:cursor-default"
                    style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)`, boxShadow: `0 0 40px ${accent}66` }}
                >
                    <span>🛒</span> {ctaText} <span>→</span>
                </button>
                <p className="mt-4 text-[10px] text-white/30 uppercase tracking-widest">{language === 'ar' ? '🔒 دفع عند الاستلام | شحن سريع | معاينة قبل الاستلام' : '🔒 Cash on Delivery | Fast delivery | Inspection before delivery'}</p>
            </section>

            {/* Features & Benefits */}
            {benefits.length > 0 && (
                <section className="relative z-10 py-20 px-4 bg-white/[0.02]">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-3xl sm:text-5xl font-black text-center mb-16 italic">{language === 'ar' ? 'مميزات المنتج' : 'Key Features'}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {benefits.map((b, i) => (
                                <div key={i} className="flex gap-6 p-8 rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-sm group hover:border-white/20 transition-all">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0"
                                        style={{ background: `${accent}22`, color: accent }}>{i + 1}</div>
                                    <p className="text-lg text-white/80 leading-relaxed font-medium">{b[language]}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials */}
            {testimonials.length > 0 && (
                <section className="relative z-10 py-20 px-4">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-3xl font-black mb-12 flex items-center gap-4">
                            <span className="h-px flex-1 bg-white/10" />
                            {language === 'ar' ? 'آراء العملاء' : 'Testimonials'}
                            <span className="h-px flex-1 bg-white/10" />
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {testimonials.map((t, i) => (
                                <div key={i} className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                                    <div className="flex gap-1 mb-4">
                                        {[1,2,3,4,5].map(s => <span key={s} className="text-lg" style={{ color: s <= t.rating ? '#FFD700' : '#ffffff10' }}>★</span>)}
                                    </div>
                                    <p className="text-white/70 mb-6 italic leading-relaxed">"{t.text[language]}"</p>
                                    <p className="font-bold text-sm" style={{ color: accent }}>— {t.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Guarantee */}
            {guarantee && (
                <section className="relative z-10 py-20 px-4">
                    <div className="max-w-3xl mx-auto text-center p-12 rounded-[40px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">🛡️</div>
                        <p className="text-xl sm:text-2xl font-medium leading-relaxed text-white/90">{guarantee}</p>
                    </div>
                </section>
            )}

            <footer className="relative z-10 py-12 text-center border-t border-white/5 opacity-30 text-[10px] uppercase tracking-widest">
                {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All Rights Reserved'} &copy; {new Date().getFullYear()}
            </footer>
        </div>
    );
}
