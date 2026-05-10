"use client";

import { useState, useEffect } from 'react';
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
    const [visitorCount, setVisitorCount] = useState(Math.floor(Math.random() * 40) + 18);
    const isRTL = language === 'ar';

    const accent = content.accent_color || '#8B5CF6';

    useEffect(() => {
        if (isPreview) return;
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
        return () => clearInterval(timer);
    }, [isPreview]);

    useEffect(() => {
        if (isPreview) return;
        const interval = setInterval(() => {
            setVisitorCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));
        }, 4000);
        return () => clearInterval(interval);
    }, [isPreview]);

    const pad = (n: number) => String(n).padStart(2, '0');

    const headline = content.headline?.[language] || product.name[language];
    const subheadline = content.subheadline?.[language] || '';
    const ctaText = content.cta_text?.[language] || (language === 'ar' ? 'اطلب الآن' : 'Order Now');
    const benefits = content.benefits || [];
    const guarantee = content.guarantee_text?.[language] || '';
    const testimonials = content.testimonials || [];
    const heroImage = content.hero_image || product.images?.[0];
    const finalPrice = product.sale_price || product.price;
    const originalPrice = product.sale_price ? product.price : null;

    // CTA goes to the actual product page.
    // On subdomain: tenant.orderlyshops.com/{productId} → product page via middleware.
    const checkoutUrl = `/${productId}`;

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
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border"
                    style={{ borderColor: accent, color: accent, background: `${accent}15` }}>
                    <span>⚡</span>
                    {language === 'ar' ? 'عرض محدود الوقت' : 'Limited Time Offer'}
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-tight mb-4 max-w-4xl"
                    style={{ textShadow: `0 0 60px ${accent}66` }}>
                    <span style={{
                        background: `linear-gradient(135deg, #fff 40%, ${accent})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        {headline}
                    </span>
                </h1>

                {subheadline && (
                    <p className="text-lg sm:text-xl text-white/60 mb-8 max-w-2xl leading-relaxed">
                        {subheadline}
                    </p>
                )}

                {/* Countdown */}
                <div className="flex items-center gap-3 mb-8">
                    {[
                        { val: pad(timeLeft.hours), label: language === 'ar' ? 'ساعة' : 'HRS' },
                        { val: pad(timeLeft.minutes), label: language === 'ar' ? 'دقيقة' : 'MIN' },
                        { val: pad(timeLeft.seconds), label: language === 'ar' ? 'ثانية' : 'SEC' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="text-center">
                                <div className="w-16 h-16 flex items-center justify-center rounded-xl border font-mono text-2xl font-black"
                                    style={{ borderColor: `${accent}44`, background: `${accent}15`, color: accent }}>
                                    {item.val}
                                </div>
                                <div className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">{item.label}</div>
                            </div>
                            {i < 2 && <span className="text-2xl font-bold" style={{ color: accent }}>:</span>}
                        </div>
                    ))}
                </div>

                {/* Product Image */}
                {heroImage && (
                    <div className="relative mb-8 group">
                        <div className="absolute inset-0 rounded-2xl blur-2xl opacity-40 scale-95 transition-all group-hover:opacity-60"
                            style={{ background: `radial-gradient(circle, ${accent}, transparent)` }} />
                        <img
                            src={heroImage}
                            alt={headline}
                            className="relative w-64 h-64 sm:w-80 sm:h-80 object-cover rounded-2xl border border-white/10 shadow-2xl transition-transform group-hover:scale-105"
                        />
                    </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-4 mb-6">
                    {originalPrice && (
                        <span className="text-xl text-white/30 line-through">
                            {originalPrice} {product.currency}
                        </span>
                    )}
                    <span className="text-4xl font-black" style={{ color: accent }}>
                        {finalPrice} {product.currency}
                    </span>
                </div>

                {/* CTA Button */}
                {!isPreview ? (
                    <Link href={checkoutUrl}
                        className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-black text-lg transition-all hover:scale-105 hover:shadow-2xl active:scale-95"
                        style={{
                            background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                            boxShadow: `0 0 40px ${accent}66`
                        }}>
                        <span>🛒</span>
                        {ctaText}
                        <span>→</span>
                    </Link>
                ) : (
                    <button
                        className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-black text-lg cursor-default"
                        style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)`, boxShadow: `0 0 40px ${accent}66` }}>
                        <span>🛒</span>
                        {ctaText}
                        <span>→</span>
                    </button>
                )}

                <p className="mt-3 text-xs text-white/30">
                    {language === 'ar' ? '🔒 دفع عند الاستلام | شحن سريع | معاينة قبل الاستلام' : '🔒 Cash on Delivery | Fast delivery | Inspection before delivery'}
                </p>
            </section>

            {/* Benefits Section */}
            {benefits.length > 0 && (
                <section className="relative z-10 py-16 px-4">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl sm:text-3xl font-black text-center mb-10">
                            {language === 'ar' ? 'لماذا ستحب هذا المنتج؟' : 'Why You Will Love This'}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {benefits.map((b, i) => (
                                <div key={i}
                                    className="p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-white/20 transition-all group">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 font-bold text-lg"
                                        style={{ background: `${accent}22`, color: accent }}>
                                        {i + 1}
                                    </div>
                                    <p className="text-sm text-white/80 leading-relaxed">
                                        {b[language]}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials */}
            {testimonials.length > 0 && (
                <section className="relative z-10 py-16 px-4">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl sm:text-3xl font-black text-center mb-10">
                            {language === 'ar' ? 'ماذا قال عملاؤنا؟' : 'What Our Customers Say'}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {testimonials.map((t, i) => (
                                <div key={i} className="p-6 rounded-xl border border-white/10 bg-white/5">
                                    <div className="flex gap-1 mb-3">
                                        {Array.from({ length: 5 }).map((_, s) => (
                                            <span key={s} style={{ color: s < t.rating ? '#FFD700' : '#ffffff30' }}>★</span>
                                        ))}
                                    </div>
                                    <p className="text-sm text-white/70 mb-3 italic">"{t.text[language]}"</p>
                                    <p className="text-xs font-bold" style={{ color: accent }}>— {t.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Guarantee */}
            {guarantee && (
                <section className="relative z-10 py-12 px-4">
                    <div className="max-w-2xl mx-auto text-center p-8 rounded-2xl border border-white/10"
                        style={{ background: `${accent}10` }}>
                        <div className="text-4xl mb-3">🛡️</div>
                        <h3 className="font-black text-xl mb-2">
                            {language === 'ar' ? 'ضماننا لك' : 'Our Guarantee'}
                        </h3>
                        <p className="text-white/60 text-sm leading-relaxed">{guarantee}</p>
                    </div>
                </section>
            )}

            {/* Final CTA */}
            <section className="relative z-10 py-16 px-4 text-center">
                <h2 className="text-2xl sm:text-3xl font-black mb-4">
                    {language === 'ar' ? 'لا تفوّت الفرصة!' : "Don't Miss Out!"}
                </h2>
                <p className="text-white/50 mb-6 text-sm">
                    {language === 'ar' ? `${visitorCount} شخص يشاهد هذا المنتج — العرض ينتهي قريباً` : `${visitorCount} viewing — Offer ends soon`}
                </p>
                {!isPreview ? (
                    <Link href={checkoutUrl}
                        className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-black text-lg transition-all hover:scale-105"
                        style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)`, boxShadow: `0 0 40px ${accent}66` }}>
                        <span>⚡</span>
                        {ctaText}
                    </Link>
                ) : (
                    <button
                        className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-black text-lg cursor-default"
                        style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)`, boxShadow: `0 0 40px ${accent}66` }}>
                        <span>⚡</span>
                        {ctaText}
                    </button>
                )}
            </section>
        </div>
    );
}
