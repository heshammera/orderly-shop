"use client";

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
    const finalPrice = product.sale_price || product.price || 0;
    const originalPrice = product.sale_price ? (product.price || null) : null;

    // CTA goes to the actual product page.
    const checkoutUrl = `/${productId}`;

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[#FAF8F5] text-gray-900 overflow-x-hidden" style={{ fontFamily: "'Playfair Display', 'Cairo', Georgia, serif" }}>

            {/* Top thin accent bar */}
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accent}, #D4AF37, ${accent})` }} />

            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col lg:flex-row items-center px-6 py-16 max-w-7xl mx-auto gap-12">

                {/* Left: Image */}
                <div className="flex-1 flex justify-center">
                    {heroImage ? (
                        <div className="relative">
                            <div className="absolute inset-4 rounded-3xl" style={{ background: `${accent}15` }} />
                            <img
                                src={heroImage}
                                alt={headline}
                                className="relative w-72 h-72 sm:w-96 sm:h-96 lg:w-[440px] lg:h-[440px] object-cover rounded-3xl shadow-2xl"
                            />
                            {/* Small decorative element */}
                            <div className="absolute -bottom-4 -start-4 w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-xs text-center shadow-lg"
                                style={{ background: `linear-gradient(135deg, ${accent}, #D4AF37)` }}>
                                <div>
                                    {originalPrice ? (
                                        <>
                                            <div className="text-xs opacity-80">{language === 'ar' ? 'خصم' : 'SALE'}</div>
                                            <div className="text-base font-black">
                                                {Math.round(((originalPrice - finalPrice) / originalPrice) * 100)}%
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-xs">{language === 'ar' ? 'حصري' : 'EXCLUSIVE'}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-96 h-96 rounded-3xl flex items-center justify-center" style={{ background: `${accent}10` }}>
                            <span className="text-6xl">✨</span>
                        </div>
                    )}
                </div>

                {/* Right: Content */}
                <div className="flex-1 text-center lg:text-start space-y-6">
                    {/* Thin decorative line */}
                    <div className="flex items-center gap-3 justify-center lg:justify-start">
                        <div className="h-px flex-1 max-w-12" style={{ background: accent }} />
                        <span className="text-xs font-medium tracking-[0.3em] uppercase" style={{ color: accent }}>
                            {language === 'ar' ? 'تجربة استثنائية' : 'Premium Experience'}
                        </span>
                        <div className="h-px flex-1 max-w-12" style={{ background: accent }} />
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-gray-900">
                        {headline}
                    </h1>

                    {subheadline && (
                        <p className="text-lg text-gray-500 leading-relaxed max-w-lg">
                            {subheadline}
                        </p>
                    )}

                    {/* Price */}
                    <div className="flex items-end gap-3 justify-center lg:justify-start">
                        <span className="text-4xl font-black" style={{ color: accent }}>
                            {finalPrice} {product.currency}
                        </span>
                        {originalPrice && (
                            <span className="text-xl text-gray-400 line-through mb-1">
                                {originalPrice} {product.currency}
                            </span>
                        )}
                    </div>

                    {/* CTA */}
                    {!isPreview ? (
                        <Link href={checkoutUrl}
                            className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-bold text-base text-white transition-all hover:scale-105 hover:shadow-xl active:scale-95"
                            style={{ background: `linear-gradient(135deg, ${accent}, #D4AF37)`, boxShadow: `0 8px 30px ${accent}44` }}>
                            {ctaText}
                            <span>→</span>
                        </Link>
                    ) : (
                        <button
                            className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-bold text-base text-white cursor-default"
                            style={{ background: `linear-gradient(135deg, ${accent}, #D4AF37)`, boxShadow: `0 8px 30px ${accent}44` }}>
                            {ctaText}
                            <span>→</span>
                        </button>
                    )}

                    <p className="text-xs text-gray-400">
                        {language === 'ar' ? '🔒 دفع عند الاستلام | شحن سريع | معاينة قبل الاستلام' : '🔒 Cash on Delivery | Fast shipping | Inspection before delivery'}
                    </p>
                </div>
            </section>

            {/* Divider */}
            <div className="max-w-5xl mx-auto px-6">
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            </div>

            {/* Benefits */}
            {benefits.length > 0 && (
                <section className="py-16 px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12">
                            <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: accent }}>
                                {language === 'ar' ? 'لماذا تختارنا' : 'Why Choose Us'}
                            </p>
                            <h2 className="text-3xl font-black text-gray-900">
                                {language === 'ar' ? 'مميزات استثنائية' : 'Exceptional Benefits'}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {benefits.map((b, i) => (
                                <div key={i} className="text-center p-6 group">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold"
                                        style={{ background: `linear-gradient(135deg, ${accent}, #D4AF37)` }}>
                                        {i + 1}
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">{b[language]}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials */}
            {testimonials.length > 0 && (
                <section className="py-16 px-6 bg-white">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12">
                            <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: accent }}>
                                {language === 'ar' ? 'آراء العملاء' : 'Client Reviews'}
                            </p>
                            <h2 className="text-3xl font-black text-gray-900">
                                {language === 'ar' ? 'ثقة العملاء' : 'Trusted by Clients'}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {testimonials.map((t, i) => (
                                <div key={i} className="p-6 border border-gray-100 rounded-2xl bg-[#FAF8F5] shadow-sm">
                                    <div className="flex gap-1 mb-3">
                                        {Array.from({ length: 5 }).map((_, s) => (
                                            <span key={s} style={{ color: s < t.rating ? accent : '#D1D5DB' }}>★</span>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4 italic leading-relaxed">"{t.text[language]}"</p>
                                    <p className="text-xs font-bold" style={{ color: accent }}>— {t.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Guarantee */}
            {guarantee && (
                <section className="py-12 px-6">
                    <div className="max-w-2xl mx-auto text-center p-8 border border-gray-200 rounded-3xl bg-white shadow-sm">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-white"
                            style={{ background: `linear-gradient(135deg, ${accent}, #D4AF37)` }}>
                            🛡️
                        </div>
                        <h3 className="font-black text-xl text-gray-900 mb-2">
                            {language === 'ar' ? 'معاينة قبل الاستلام وضمان ارجاع' : 'Inspection before receipt & Return Guarantee'}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{guarantee}</p>
                    </div>
                </section>
            )}

            {/* Final CTA */}
            <section className="py-16 px-6 text-center" style={{ background: `linear-gradient(135deg, #FAF8F5, ${accent}10)` }}>
                <p className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: accent }}>
                    {language === 'ar' ? 'لا تتأخر' : 'Act Now'}
                </p>
                <h2 className="text-3xl font-black text-gray-900 mb-6">
                    {headline}
                </h2>
                {!isPreview ? (
                    <Link href={checkoutUrl}
                        className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-bold text-base text-white transition-all hover:scale-105 hover:shadow-xl"
                        style={{ background: `linear-gradient(135deg, ${accent}, #D4AF37)`, boxShadow: `0 8px 30px ${accent}44` }}>
                        {ctaText}
                        <span>→</span>
                    </Link>
                ) : (
                    <button
                        className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-bold text-base text-white cursor-default"
                        style={{ background: `linear-gradient(135deg, ${accent}, #D4AF37)`, boxShadow: `0 8px 30px ${accent}44` }}>
                        {ctaText}
                        <span>→</span>
                    </button>
                )}
            </section>

            {/* Bottom accent bar */}
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accent}, #D4AF37, ${accent})` }} />
        </div>
    );
}
