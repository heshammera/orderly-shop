"use client";

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Star, ShieldCheck, Zap, Check, Cpu, Box, Globe, MousePointer2 } from 'lucide-react';

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

interface CyberTemplateProps {
    content: LandingContent;
    product: ProductData;
    language: 'ar' | 'en';
    storeSlug: string;
    productId: string;
    isPreview?: boolean;
    forceMobile?: boolean;
}

export function CyberTemplate({ content, product, language, storeSlug, productId, isPreview = false, forceMobile = false }: CyberTemplateProps) {
    const isRTL = language === 'ar';
    const accent = content.accent_color || '#00f2ff'; // Cyber Cyan

    const headline = content.headline?.[language] || product.name?.[language] || (language === 'ar' ? 'تكنولوجيا الغد' : 'Tech of Tomorrow');
    const subheadline = content.subheadline?.[language] || '';
    const ctaText = content.cta_text?.[language] || (language === 'ar' ? 'ابدأ النقلة النوعية' : 'Upgrade Now');
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
        <div dir={isRTL ? 'rtl' : 'ltr'} className="relative min-h-screen bg-[#020617] text-slate-300 overflow-x-hidden selection:bg-cyan-500/30 font-mono">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20" />

            {/* Hero Section */}
            <section className="relative pt-24 pb-32 px-6">
                <div className={cn(
                    "max-w-7xl mx-auto grid gap-20 items-center",
                    forceMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
                )}>
                    {/* Content */}
                    <div className="space-y-10 animate-in fade-in slide-in-from-left-10 duration-1000">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }} />
                                <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: accent }}>Next-Gen Interface</span>
                            </div>
                            <h1 className={cn(
                                "font-black text-white leading-[0.9] italic tracking-tighter uppercase",
                                forceMobile ? "text-3xl" : "text-4xl md:text-8xl"
                            )}>
                                {headline.split(' ').map((word, i) => (
                                    <span key={i} style={{ color: i % 2 === 1 ? accent : undefined }}>
                                        {word}{' '}
                                    </span>
                                ))}
                            </h1>
                            <p className={cn(
                                "text-slate-500 leading-relaxed border-s-2",
                                forceMobile ? "text-[10px] max-w-full ps-3" : "text-sm md:text-lg max-w-lg ps-6"
                            )} style={{ borderColor: `${accent}33` }}>
                                {subheadline}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                            <div className="bg-slate-900/50 border border-slate-800 p-4 md:p-6 rounded-2xl backdrop-blur-md">
                                <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Unit Price</div>
                                <div className="text-3xl md:text-4xl font-black text-white flex items-baseline gap-2">
                                    {finalPrice} <span className="text-xs font-bold" style={{ color: accent }}>{product.currency}</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-4 w-full">
                                <Button 
                                    onClick={handleBuyNow}
                                    className="w-full h-16 text-black font-black text-lg skew-x-[-12deg] transition-all hover:skew-x-0 group"
                                    style={{ backgroundColor: accent, boxShadow: `0 0 30px ${accent}33` }}
                                >
                                    <span className="skew-x-[12deg] group-hover:skew-x-0 transition-transform flex items-center gap-3">
                                        {ctaText}
                                        <MousePointer2 className="w-5 h-5" />
                                    </span>
                                </Button>
                                <div className="flex justify-between px-2 text-[9px] font-bold text-slate-600 tracking-[0.2em]">
                                    <span>ENCRYPTED_CHECKOUT</span>
                                    <span>FAST_SYNC</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visual - Floating Tech Box */}
                    <div className="relative animate-in zoom-in duration-1000 delay-300">
                        <div className="absolute -inset-10 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
                        <div className="relative z-10 p-4 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] backdrop-blur-md shadow-2xl">
                            <div className="absolute top-8 right-8 flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                            </div>
                            <div className="rounded-[2rem] overflow-hidden border border-slate-800 aspect-square group">
                                <img 
                                    src={selectedImage} 
                                    alt={headline} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] to-transparent opacity-40" />
                            </div>

                            {/* HUD Elements */}
                            <div className="absolute -bottom-4 -left-4 md:-bottom-8 md:-left-8 p-3 md:p-4 rounded-xl shadow-2xl animate-bounce" style={{ backgroundColor: accent }}>
                                <Box className="w-5 h-5 md:w-6 md:h-6 text-black" />
                            </div>
                            <div className="absolute -top-4 -right-4 md:-top-6 md:-right-6 bg-slate-900 border p-2 md:p-3 rounded-xl backdrop-blur-xl" style={{ borderColor: `${accent}33` }}>
                                <div className="text-[9px] md:text-[10px] font-bold mb-1" style={{ color: accent }}>SCANNING...</div>
                                <div className="h-1 w-16 md:w-20 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full w-2/3 animate-[shimmer_2s_infinite]" style={{ backgroundColor: accent }} />
                                </div>
                            </div>

                            {/* Product Gallery Thumbnails */}
                            {product.images && product.images.length > 1 && (
                                <div className="flex gap-3 mt-6 justify-center overflow-x-auto no-scrollbar py-2">
                                    {product.images.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedImage(img)}
                                            className={cn(
                                                "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-300",
                                                selectedImage === img ? "scale-110 shadow-lg" : "opacity-40 hover:opacity-100 border-transparent"
                                            )}
                                            style={{ borderColor: selectedImage === img ? accent : 'transparent' }}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Grid Sections */}
            {((content.product_sections || []).length > 0 || product.images.length > 1) && (
                <section className="py-24 px-6 relative z-10">
                    <div className="max-w-7xl mx-auto">
                        <div className={cn(
                            "grid gap-6 md:gap-8",
                            forceMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                        )}>
                            {((content.product_sections || []).length > 0 ? content.product_sections! : product.images.slice(1).map(img => ({
                                image: img,
                                title: { ar: 'ميزة احترافية', en: 'Pro Feature' },
                                description: { ar: 'وصف دقيق للميزة وكيفية استفادة العميل منها لزيادة الثقة.', en: 'Detailed feature description and customer benefit to build trust.' }
                            }))).map((section, idx) => (
                                <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-md group hover:border-cyan-500/50 transition-all duration-500 flex flex-col">
                                    <div className="aspect-square overflow-hidden relative">
                                        <img src={section.image} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] to-transparent opacity-60" />
                                        <div className="absolute bottom-4 inset-x-4 p-4">
                                            <h3 className="text-lg font-black text-white italic tracking-tighter uppercase">{section.title[language]}</h3>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4 flex-1">
                                        <p className="text-slate-400 text-[10px] leading-relaxed border-s-2 ps-4" style={{ borderColor: `${accent}33` }}>
                                            {section.description[language]}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Tech Specs (Benefits) */}
            {benefits.length > 0 && (
                <section className="py-32 relative">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className={cn(
                            "grid gap-8",
                            forceMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
                        )}>
                            {benefits.map((b, i) => (
                                <div key={i} className="group p-8 bg-slate-900/30 border border-slate-800 rounded-3xl hover:border-cyan-500/50 transition-all duration-500 hover:-translate-y-2">
                                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-cyan-500 mb-6 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                                        {i === 0 ? <Cpu className="w-6 h-6" /> : i === 1 ? <Box className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
                                    </div>
                                    <h3 className="text-xs font-black tracking-widest text-slate-500 uppercase mb-4">Module 0{i+1}</h3>
                                    <p className="text-white text-sm leading-relaxed">{b[language]}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials - Terminal Style */}
            {testimonials.length > 0 && (
                <section className="py-32 bg-slate-950/50">
                    <div className="max-w-5xl mx-auto px-6 space-y-12">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">User Feedback</h2>
                            <div className="flex-1 h-[1px] bg-slate-800" />
                        </div>
                        <div className={cn(
                            "grid gap-8",
                            forceMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
                        )}>
                            {testimonials.map((t, i) => (
                                <div key={i} className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-colors" />
                                    <div className="flex gap-1 mb-6">
                                        {Array.from({ length: 5 }).map((_, s) => (
                                            <Star key={s} className={cn("w-3 h-3", s < t.rating ? "fill-cyan-500 text-cyan-500" : "text-slate-800")} />
                                        ))}
                                    </div>
                                    <p className="text-lg text-white font-medium mb-6 relative z-10 italic">
                                        "{t.text[language]}"
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-sm bg-slate-800 flex items-center justify-center text-[10px] font-black text-cyan-500">U_{i}</div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Guarantee - Tech Panel */}
            <section className="py-40 px-6">
                <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-900 to-[#020617] border border-cyan-500/20 p-12 rounded-[3rem] text-center space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[linear-gradient(90deg,transparent,rgba(6,182,212,0.5),transparent)]" />
                    <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl mx-auto flex items-center justify-center">
                        <ShieldCheck className="w-10 h-10 text-cyan-500 animate-pulse" />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter">Secure Protocol</h3>
                        <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed font-mono">
                            {guarantee}
                        </p>
                    </div>
                    <Button 
                        onClick={handleBuyNow}
                        className="h-14 px-12 bg-transparent border border-cyan-500/30 text-cyan-500 hover:bg-cyan-500 hover:text-black transition-all rounded-xl font-black uppercase tracking-widest text-xs"
                    >
                        Initiate Connection
                    </Button>
                </div>
            </section>

            {/* Sticky Buy Button */}
            <div className="fixed bottom-0 inset-x-0 z-[100] p-4 flex justify-center pointer-events-none">
                <div className="max-w-md w-full pointer-events-auto animate-in slide-in-from-bottom-10 duration-500">
                    <Button 
                        onClick={handleBuyNow}
                        className="w-full h-16 text-black font-black text-lg skew-x-[-12deg] transition-all hover:skew-x-0 group relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t border-white/10"
                        style={{ backgroundColor: accent, boxShadow: `0 -10px 40px ${accent}33` }}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <span className="skew-x-[12deg] group-hover:skew-x-0 transition-transform flex items-center justify-between w-full px-6">
                            <span className="flex items-center gap-3">
                                <Zap className="w-5 h-5 animate-pulse" />
                                {ctaText}
                            </span>
                            <span className="bg-black/10 px-4 py-1 rounded-lg text-sm">
                                {finalPrice} {product.currency}
                            </span>
                        </span>
                    </Button>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-12 pb-32 border-t border-slate-900 text-center">
                <span className="text-[10px] font-bold tracking-[0.4em] text-slate-700">CYBER_UI_CORE_V2 // 2026</span>
            </footer>
        </div>
    );
}
