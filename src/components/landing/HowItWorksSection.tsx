"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { landingDataAr, landingDataEn } from '@/lib/landing-data';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { UserPlus, Paintbrush, Box, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { staggerContainer, fadeInUp } from '@/lib/motion';

const iconMap: Record<string, any> = {
    userPlus: UserPlus,
    paintbrush: Paintbrush,
    box: Box,
    rocket: Rocket,
};

export function HowItWorksSection() {
    const { language, dir } = useLanguage();
    const data = language === 'ar' ? landingDataAr.howItWorks : landingDataEn.howItWorks;
    const rtl = language === 'ar';

    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start center", "end center"]
    });

    const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
    const lineWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    return (
        <section id="how-it-works" className="py-24 bg-card border-y border-border/50 relative overflow-hidden">

            {/* Background patterns */}
            <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-foreground to-transparent pointer-events-none"></div>

            <div className="container mx-auto px-4 max-w-7xl relative z-10">

                {/* Header */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeInUp}
                    className="text-center max-w-3xl mx-auto mb-20"
                >
                    <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4 border border-primary/20">
                        {data.badge}
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-foreground">
                        {data.title}
                    </h2>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        {data.subtitle}
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="relative py-10 max-w-5xl mx-auto" ref={ref}>

                    {/* Desktop Horizontal Line */}
                    <div className="hidden md:block absolute top-[68px] left-[10%] right-[10%] h-1 bg-border rounded-full overflow-hidden">
                        <motion.div
                            className={cn("absolute top-0 bottom-0 bg-primary", rtl ? "right-0" : "left-0")}
                            style={{ width: lineWidth }}
                        />
                    </div>

                    {/* Mobile Vertical Line */}
                    <div className="md:hidden absolute top-[10%] bottom-[10%] w-1 bg-border rounded-full overflow-hidden left-8 rtl:left-auto rtl:right-8">
                        <motion.div
                            className="absolute top-0 left-0 right-0 bg-primary"
                            style={{ height: lineHeight }}
                        />
                    </div>

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="flex flex-col md:flex-row justify-between gap-10 md:gap-4 relative"
                    >
                        {data.steps.map((step, idx) => {
                            const Icon = iconMap[step.iconName] || UserPlus;

                            return (
                                <motion.div
                                    key={step.id}
                                    variants={fadeInUp}
                                    className="flex md:flex-col items-center md:text-center gap-6 md:gap-6 flex-1 group"
                                >
                                    {/* Icon Circular Node */}
                                    <div className="relative flex-shrink-0 z-10 w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-full bg-card border-4 border-border flex items-center justify-center text-muted-foreground group-hover:border-primary group-hover:text-primary group-hover:shadow-glow transition-all duration-500 bg-white dark:bg-card">
                                        <span className="absolute -top-3 -right-3 md:-top-2 md:-right-4 font-black text-2xl md:text-3xl text-border opacity-50 group-hover:text-primary group-hover:opacity-100 transition-colors uppercase pointer-events-none">
                                            {step.number}
                                        </span>
                                        <Icon className="w-8 h-8 md:w-10 md:h-10 transition-transform group-hover:scale-110 duration-300" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 md:w-full">
                                        <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                                            {step.title}
                                        </h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>

            </div>
        </section>
    );
}
