"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { landingDataAr, landingDataEn } from '@/lib/landing-data';
import { motion } from 'framer-motion';
import { Layers, Zap, Search, Cpu } from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/lib/motion';

const iconMap: Record<string, any> = {
    layers: Layers,
    zap: Zap,
    search: Search,
    cpu: Cpu,
};

export function AdvancedCapabilities() {
    const { language } = useLanguage();
    const data = language === 'ar' ? landingDataAr.capabilities : landingDataEn.capabilities;

    return (
        <section className="py-24 bg-foreground relative overflow-hidden text-background">

            {/* Dark background subtle glow */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/20 rounded-full blur-[150px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-accent/20 rounded-full blur-[150px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-mamba.png')] opacity-10 pointer-events-none"></div>

            <div className="container mx-auto px-4 max-w-7xl relative z-10">

                {/* Header */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeInUp}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <div className="inline-block px-4 py-1.5 rounded-full bg-background/10 text-background/90 font-semibold text-sm mb-6 border border-background/20 backdrop-blur-sm">
                        {data.badge}
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-white">
                        {data.title}
                    </h2>
                    <p className="text-xl text-white/70 leading-relaxed">
                        {data.subtitle}
                    </p>
                </motion.div>

                {/* Capabilities Grid */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid md:grid-cols-2 gap-6 lg:gap-8"
                >
                    {data.items.map((item, idx) => {
                        const Icon = iconMap[item.iconName] || Layers;
                        return (
                            <motion.div
                                key={item.id}
                                variants={fadeInUp}
                                className="group relative bg-background/5 hover:bg-background/10 backdrop-blur-md rounded-2xl p-8 lg:p-10 border border-white/10 hover:border-primary/50 transition-all duration-500 overflow-hidden"
                            >
                                {/* Glow effect on hover */}
                                <div className="absolute -inset-2 bg-gradient-to-r from-primary/0 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full group-hover:duration-1000 -skew-x-12"></div>

                                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 group-hover:scale-110 group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                                        <Icon className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-primary-300 transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-white/60 leading-relaxed text-lg">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
