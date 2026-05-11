"use client";

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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

interface ProductData {
    name: { ar: string; en: string };
    price: number;
    sale_price?: number;
    currency: string;
    images: string[];
}

interface TrustTemplateProps {
    content: LandingContent;
    product: ProductData;
    language: 'ar' | 'en';
    storeSlug: string;
    productId: string;
    isPreview?: boolean;
    forceMobile?: boolean;
}

const TRUST_BADGES = {
    ar: ['🔒 دفع عند الاستلام', '🚚 شحن سريع', '↩️ معاينة قبل الاستلام', '⭐ ضمان الجودة'],
    en: ['🔒 Cash on Delivery', '🚚 Fast Shipping', '↩️ Inspection before delivery', '⭐ Quality Guarantee'],
};

export function TrustTemplate({ content, product, language, storeSlug, productId, isPreview = false, forceMobile = false }: TrustTemplateProps) {
    const isRTL = language === 'ar';
    const accent = content.accent_color || '#2563EB';

    const headline = content.headline?.[language] || product.name?.[language] || (language === 'ar' ? 'منتج موثوق' : 'Trusted Product');
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
        <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-white text-gray-900 overflow-x-hidden" style={{ fontFamily: "'Inter', 'Cairo', sans-serif" }}>

            {/* Trust Bar */}
            <div className="py-2 px-4 text-white text-xs font-medium" style={{ background: accent }}>
                <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-4">
                    {TRUST_BADGES[language].map((b, i) => (
                        <span key={i}>{b}</span>
                    ))}
                </div>
            </div>

            {/* Hero Section */}
            <section className="relative py-12 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className={cn(
                        "flex flex-col gap-10",
                        forceMobile ? "lg:flex-col" : "lg:flex-row items-center"
                    )}>

                        {/* Image */}
                        <div className="flex-shrink-0 flex flex-col items-center gap-4">
                            {selectedImage ? (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <img
                                            src={selectedImage}
                                            alt={headline}
                                            className="w-64 h-64 sm:w-80 sm:h-80 object-cover rounded-2xl shadow-xl border border-gray-100 transition-all duration-300"
                                        />
                                        {/* Sale badge */}
                                        {originalPrice && originalPrice > 0 && finalPrice < originalPrice && (
                                            <div className="absolute top-3 start-3 px-3 py-1 rounded-full text-white text-xs font-bold"
                                                style={{ background: '#EF4444' }}>
                                                {language === 'ar' ? 'خصم' : 'SALE'} {Math.round(((originalPrice - finalPrice) / originalPrice) * 100)}%
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Professional Thumbnails */}
                                    {product.images && product.images.length > 1 && (
                                        <div className="flex gap-2 justify-center">
                                            {product.images.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedImage(img)}
                                                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                                                        selectedImage === img ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                    style={{ borderColor: selectedImage === img ? accent : undefined }}
                                                >
                                                    <img src={img} className="w-full h-full object-cover" alt="" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-80 h-80 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200">
                                    <span className="text-5xl">📦</span>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-5">
                            {/* Stars */}
                            <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <span key={i} className="text-yellow-400 text-sm">★</span>
                                    ))}
                                </div>
                                <span className="text-xs text-gray-500">
                                    {language === 'ar' ? `(${testimonials.length || 47} تقييم)` : `(${testimonials.length || 47} reviews)`}
                                </span>
                            </div>

                            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight text-gray-900">
                                {headline}
                            </h1>

                            {subheadline && (
                                <p className="text-gray-500 leading-relaxed">{subheadline}</p>
                            )}

                            {/* Price */}
                            <div className="flex items-end gap-3 flex-wrap">
                                <span className="text-3xl sm:text-4xl font-black" style={{ color: accent }}>
                                    {finalPrice} {product.currency}
                                </span>
                                {originalPrice && (
                                    <span className="text-lg sm:text-xl text-gray-400 line-through mb-1">
                                        {originalPrice} {product.currency}
                                    </span>
                                )}
                                {originalPrice && originalPrice > 0 && finalPrice < originalPrice && (
                                    <span className="px-3 py-1 bg-red-50 text-red-600 text-sm font-bold rounded-full mb-1">
                                        {language === 'ar'
                                            ? `وفّر ${Math.round(originalPrice - finalPrice)} ${product.currency}`
                                            : `Save ${Math.round(originalPrice - finalPrice)} ${product.currency}`}
                                    </span>
                                )}
                            </div>

                            {/* CTA */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button 
                                    onClick={handleBuyNow}
                                    disabled={isPreview}
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white transition-all hover:opacity-90 hover:shadow-lg active:scale-95 disabled:cursor-default flex-1 sm:flex-none"
                                    style={{ background: accent }}
                                >
                                    🛒 {ctaText}
                                </button>
                            </div>

                            {/* Micro-trust signals */}
                            <div className="flex flex-wrap gap-4 pt-2">
                                {TRUST_BADGES[language].map((b, i) => (
                                    <span key={i} className="text-xs text-gray-500 flex items-center gap-1">{b}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Grid Sections */}
            {((content.product_sections || []).length > 0 || product.images.length > 1) && (
                <section className="py-16 px-4 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className={cn(
                            "grid gap-6 md:gap-8",
                            forceMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                        )}>
                            {((content.product_sections || []).length > 0 ? content.product_sections! : product.images.slice(1).map(img => ({
                                image: img,
                                title: { ar: 'ثقة ومصداقية', en: 'Trust & Quality' },
                                description: { ar: 'وصف دقيق للميزة وكيفية استفادة العميل منها لزيادة الثقة.', en: 'Detailed feature description and customer benefit to build trust.' }
                            }))).map((section, idx) => (
                                <div key={idx} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                                    <div className="aspect-square">
                                        <img src={section.image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-4 space-y-2 flex-1">
                                        <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{section.title[language]}</h3>
                                        <p className="text-gray-500 text-[10px] leading-relaxed border-s-2 ps-2 line-clamp-2" style={{ borderColor: `${accent}33` }}>
                                            {section.description[language]}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Section divider */}
            <div className="max-w-5xl mx-auto px-4">
                <hr className="border-gray-100" />
            </div>

            {/* Benefits */}
            {benefits.length > 0 && (
                <section className="py-14 px-4 bg-gray-50">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-2xl font-black text-gray-900 text-center mb-10">
                            {language === 'ar' ? 'مميزات المنتج' : 'Product Features'}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {benefits.map((b, i) => (
                                <div key={i} className="flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                                        style={{ background: accent }}>
                                        ✓
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed mt-1">{b[language]}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials */}
            {testimonials.length > 0 && (
                <section className="py-14 px-4">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-2xl font-black text-gray-900 text-center mb-10">
                            {language === 'ar' ? 'آراء العملاء الحقيقيين' : 'Real Customer Reviews'}
                        </h2>
                        <div className={cn(
                            "grid gap-5",
                            forceMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                        )}>
                            {testimonials.map((t, i) => (
                                <div key={i} className="p-5 rounded-xl border border-gray-100 shadow-sm bg-gray-50">
                                    {/* Avatar */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                            style={{ background: accent }}>
                                            {t.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-gray-900">{t.name}</div>
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: 5 }).map((_, s) => (
                                                    <span key={s} className="text-xs" style={{ color: s < t.rating ? '#F59E0B' : '#D1D5DB' }}>★</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">"{t.text[language]}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Guarantee */}
            {guarantee && (
                <section className="py-10 px-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex flex-col sm:flex-row items-center gap-6 p-7 rounded-2xl border-2" style={{ borderColor: `${accent}30`, background: `${accent}05` }}>
                            <div className="text-5xl flex-shrink-0">🛡️</div>
                            <div>
                                <h3 className="font-black text-lg text-gray-900 mb-1">
                                    {language === 'ar' ? 'معاينة قبل الاستلام وضمان ارجاع' : 'Inspection before receipt & Return Guarantee'}
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{guarantee}</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Final CTA Banner */}
            <section className="py-12 px-4 text-white text-center" style={{ background: accent }}>
                <h2 className="text-2xl font-black mb-2">{headline}</h2>
                <p className="text-white/80 text-sm mb-6">
                    {finalPrice} {product.currency}
                    {originalPrice && ` — ${language === 'ar' ? 'بدلاً من' : 'instead of'} ${originalPrice}`}
                </p>
                <button 
                    onClick={handleBuyNow}
                    disabled={isPreview}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base bg-white transition-all hover:bg-gray-50 hover:scale-105 active:scale-95 disabled:cursor-default"
                    style={{ color: accent }}
                >
                    🛒 {ctaText}
                </button>
            </section>
            {/* Sticky Buy Button */}
            <div className="fixed bottom-0 inset-x-0 z-[100] p-4 flex justify-center pointer-events-none">
                <div className="max-w-md w-full pointer-events-auto animate-in slide-in-from-bottom-10 duration-500">
                    <button 
                        onClick={handleBuyNow}
                        className="w-full h-16 rounded-xl text-white font-black text-lg shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-between px-8 border border-white/10"
                        style={{ background: accent }}
                    >
                        <span className="flex items-center gap-3">
                            <span className="text-xl">🛒</span>
                            {ctaText}
                        </span>
                        <span className="bg-black/10 px-4 py-1 rounded-lg text-sm">
                            {finalPrice} {product.currency}
                        </span>
                    </button>
                </div>
            </div>

            <div className="pb-32" />
        </div>
    );
}
