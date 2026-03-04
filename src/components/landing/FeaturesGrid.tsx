"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { landingDataAr, landingDataEn } from '@/lib/landing-data';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/motion';
import {
    Store, Wallet, Package, ClipboardList, BarChart3,
    Smartphone, Megaphone, Globe, Headphones, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, any> = {
    store: Store,
    creditCard: Wallet,
    truck: Package,
    layout: ClipboardList,
    barChart: BarChart3,
    smartphone: Smartphone,
    megaphone: Megaphone,
    globe: Globe,
    headset: Headphones,
    default: CheckCircle2
};

export function FeaturesGrid() {
    const { language } = useLanguage();
    const data = language === 'ar' ? landingDataAr.features : landingDataEn.features;

    return (
        <section id="features" className="py-24 bg-muted/20 relative">
            <div className="container mx-auto px-4 max-w-7xl relative z-10">

                {/* Header */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeInUp}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <div className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent font-semibold text-sm mb-4 border border-accent/20">
                        {data.badge}
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-foreground">
                        {data.title}
                    </h2>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        {data.subtitle}
                    </p>
                </motion.div>

                {/* Grid */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {data.items.map((feature, idx) => {
                        const Icon = iconMap[feature.iconName] || iconMap.default;
                        return (
                            <motion.div
                                key={feature.id}
                                variants={fadeInUp}
                                whileHover={{ y: -5 }}
                                className="group relative bg-card rounded-2xl p-8 border border-border/50 hover:border-primary/50 hover:shadow-glow transition-all duration-300"
                            >
                                {/* Glow effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>

                                <div className="relative z-10">
                                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-3 transition-all duration-300 text-primary">
                                        <Icon className="h-7 w-7 transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
