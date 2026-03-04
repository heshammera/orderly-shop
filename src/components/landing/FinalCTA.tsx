"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { landingDataAr, landingDataEn } from '@/lib/landing-data';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { fadeInUp, staggerContainer } from '@/lib/motion';

export function FinalCTA() {
    const { language, dir } = useLanguage();
    const data = language === 'ar' ? landingDataAr.cta : landingDataEn.cta;
    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

    return (
        <section className="relative py-32 overflow-hidden bg-foreground text-background">

            {/* Background with mesh gradient animated */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30 animate-gradient-shift blur-[100px] opacity-20 -z-10"></div>
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

            <div className="container mx-auto px-4 max-w-4xl relative z-10 text-center">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="bg-card/5 backdrop-blur-xl border border-white/10 p-10 md:p-16 rounded-[2rem] shadow-2xl overflow-hidden relative"
                >
                    {/* Internal Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl rounded-full z-0"></div>

                    <div className="relative z-10">
                        <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-white leading-tight">
                            {data.title}
                        </motion.h2>

                        <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-white/70 mb-10 leading-relaxed max-w-2xl mx-auto">
                            {data.subtitle}
                        </motion.p>

                        <motion.div variants={fadeInUp}>
                            <Link href="/signup">
                                <Button size="lg" className="h-16 px-10 rounded-full gradient-primary text-white shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300 text-xl font-bold border-0 relative overflow-hidden group">
                                    <span className="relative z-10 flex items-center">
                                        {data.buttonText}
                                        <ArrowIcon className={cn("w-6 h-6 transition-transform", dir === 'rtl' ? "mr-3 ml-0 group-hover:-translate-x-1" : "ml-3 mr-0 group-hover:translate-x-1")} />
                                    </span>
                                    {/* Sweep Shine */}
                                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shine_1.5s_ease-in-out]"></div>
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
