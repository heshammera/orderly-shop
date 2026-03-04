"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { landingDataAr, landingDataEn } from '@/lib/landing-data';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/motion';
import { AnimatedCounter } from './AnimatedCounter';
import useEmblaCarousel from 'embla-carousel-react';
import { useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SocialProofSection() {
    const { language } = useLanguage();
    const data = language === 'ar' ? landingDataAr.socialProof : landingDataEn.socialProof;

    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, direction: language === 'ar' ? 'rtl' : 'ltr' });

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    useEffect(() => {
        // Auto scroll every 4 seconds
        const interval = setInterval(() => {
            scrollNext();
        }, 4000);
        return () => clearInterval(interval);
    }, [scrollNext]);

    return (
        <section className="py-24 bg-white dark:bg-card border-y border-border/50 relative overflow-hidden">

            {/* Decorative gradients */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

            <div className="container mx-auto px-4 z-10 relative">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24 max-w-5xl mx-auto"
                >
                    {data.stats.map((stat, i) => (
                        <motion.div key={stat.id} variants={fadeInUp} className="text-center group">
                            <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent mb-2 transition-transform group-hover:scale-110 duration-500">
                                <AnimatedCounter
                                    value={parseFloat(stat.value)}
                                    prefix={stat.prefix}
                                    suffix={stat.suffix}
                                />
                            </div>
                            <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">{stat.label}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Testimonials */}
                <div className="text-center mb-12">
                    <motion.h2
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="text-3xl md:text-4xl font-bold mb-8 text-foreground"
                    >
                        {data.testimonialsTitle}
                    </motion.h2>

                    {/* Testimonial Slider */}
                    <div className="overflow-hidden max-w-6xl mx-auto relative px-4" ref={emblaRef}>
                        <div className="flex -ml-4 rtl:-mr-4 rtl:ml-0">
                            {data.testimonials.map((testi) => (
                                <div key={testi.id} className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-4 rtl:pr-4 rtl:pl-0">
                                    <div className="bg-muted/30 hover:bg-muted/50 transition-colors duration-300 border border-border/50 rounded-2xl p-8 h-full flex flex-col justify-between group">
                                        <div>
                                            {/* Stars */}
                                            <div className="flex gap-1 mb-6">
                                                {[...Array(testi.rating)].map((_, i) => (
                                                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400 drop-shadow-sm group-hover:scale-110 transition-transform" style={{ transitionDelay: `${i * 50}ms` }} />
                                                ))}
                                            </div>
                                            <p className="text-foreground/80 text-lg leading-relaxed mb-6 font-medium">"{testi.content}"</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                                                {testi.name.charAt(0)}
                                            </div>
                                            <div className={cn("text-left", language === 'ar' && "text-right")}>
                                                <h4 className="font-bold text-foreground">{testi.name}</h4>
                                                <p className="text-sm text-muted-foreground">{testi.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Fade Edges */}
                        <div className="absolute inset-y-0 left-0 w-12 md:w-24 bg-gradient-to-r from-white dark:from-card to-transparent z-10 pointer-events-none"></div>
                        <div className="absolute inset-y-0 right-0 w-12 md:w-24 bg-gradient-to-l from-white dark:from-card to-transparent z-10 pointer-events-none"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
