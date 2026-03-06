"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { landingDataAr, landingDataEn } from '@/lib/landing-data';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Activity, Package, Tag, PieChart, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeInUp, staggerContainer, fadeInLeft, fadeInRight } from '@/lib/motion';

const iconMap: Record<string, any> = {
    activity: Activity,
    package: Package,
    tag: Tag,
    pieChart: PieChart,
};

export function PlatformDemo() {
    const { language, dir } = useLanguage();
    const data = language === 'ar' ? landingDataAr.platformDemo : landingDataEn.platformDemo;
    const rtl = language === 'ar';

    const [activeModule, setActiveModule] = useState(0);

    return (
        <section id="demo" className="py-24 bg-background overflow-hidden preserve-3d">
            <div className="container mx-auto px-4 max-w-7xl">

                <div className="flex flex-col lg:flex-row gap-16 items-center">

                    {/* Text Side */}
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="w-full lg:w-5/12 z-10"
                    >
                        <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 border border-primary/20 shadow-soft">
                            <span className="text-sm font-medium">{data.badge}</span>
                        </motion.div>

                        <motion.h2 variants={fadeInUp} className="text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight text-foreground leading-[1.2]">
                            {data.title}
                        </motion.h2>

                        <motion.p variants={fadeInUp} className="text-xl text-muted-foreground mb-10 leading-relaxed">
                            {data.subtitle}
                        </motion.p>

                        <motion.div variants={staggerContainer} className="flex flex-col gap-4">
                            {data.modules.map((module, idx) => {
                                const Icon = iconMap[module.iconName] || Activity;
                                const isActive = activeModule === idx;

                                return (
                                    <motion.button
                                        key={module.id}
                                        variants={fadeInUp}
                                        onClick={() => setActiveModule(idx)}
                                        className={cn(
                                            "flex items-start gap-4 p-5 rounded-2xl text-start transition-all duration-300 border",
                                            isActive
                                                ? "bg-card border-primary/50 shadow-glow"
                                                : "bg-transparent border-transparent hover:bg-muted/40"
                                        )}
                                    >
                                        <div className={cn(
                                            "mt-1 p-3 rounded-xl transition-colors",
                                            isActive ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted text-muted-foreground"
                                        )}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className={cn("text-xl font-bold mb-1 transition-colors", isActive ? "text-primary" : "text-foreground")}>
                                                {module.name}
                                            </h3>
                                            <p className="text-muted-foreground" suppressHydrationWarning>
                                                {module.description}
                                            </p>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    </motion.div>

                    {/* Visual/Mockup Side */}
                    <motion.div
                        variants={rtl ? fadeInRight : fadeInLeft}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="w-full lg:w-7/12 relative perspective-[2000px]"
                    >
                        {/* Glowing backdrop */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-accent/20 rounded-full blur-[100px] -z-10"></div>

                        <div className="relative rotate-y-[-10deg] hover:rotate-y-[0deg] transition-transform duration-700 ease-out shadow-2xl rounded-2xl border border-border/50 bg-background/50 backdrop-blur-3xl overflow-hidden min-h-[500px] flex">

                            {/* Mock Sidebar */}
                            <div className="w-16 md:w-56 border-r border-border/50 bg-muted/20 flex flex-col p-4 gap-4">
                                <div className="w-8 h-8 rounded bg-primary/20 mb-6"></div>
                                {[1, 2, 3, 4].map((i, idx) => (
                                    <div key={i} className={cn(
                                        "h-10 rounded-lg flex items-center px-3 transition-colors",
                                        activeModule === idx ? "bg-primary/20 border border-primary/30" : "bg-transparent"
                                    )}>
                                        <div className={cn("w-4 h-4 rounded-full", activeModule === idx ? "bg-primary" : "bg-muted-foreground/30")}></div>
                                        <div className="hidden md:block w-24 h-2 bg-foreground/10 mx-2 rounded"></div>
                                    </div>
                                ))}
                            </div>

                            {/* Mock Content */}
                            <div className="flex-1 p-6 flex flex-col relative overflow-hidden">
                                <div className="h-8 border-b border-border/50 w-full mb-6 flex items-center justify-between">
                                    <div className="w-1/3 h-3 bg-muted rounded"></div>
                                    <div className="w-8 h-8 rounded-full bg-muted"></div>
                                </div>

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeModule}
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 1.05, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex-1"
                                    >
                                        {activeModule === 0 && (
                                            <div className="space-y-4 h-full">
                                                <div className="flex gap-2 sm:gap-4">
                                                    {[1, 2, 3].map(i => <div key={i} className="h-16 sm:h-24 flex-1 bg-card border border-border/50 shadow-sm rounded-xl p-2 sm:p-4"><div className="w-1/2 h-2 sm:h-4 bg-muted mb-2 rounded" /><div className="w-1/3 h-4 sm:h-6 bg-primary/30 rounded" /></div>)}
                                                </div>
                                                <div className="flex-1 min-h-[120px] w-full bg-card border border-border/50 shadow-sm rounded-xl relative overflow-hidden">
                                                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-primary/20 to-transparent"></div>
                                                    <svg className="absolute w-full h-full inset-0" preserveAspectRatio="none" viewBox="0 0 100 100">
                                                        <path d="M0,100 L0,50 Q25,30 50,60 T100,40 L100,100 Z" fill="hsl(var(--primary)/0.1)" stroke="hsl(var(--primary))" strokeWidth="2" />
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                        {activeModule === 1 && (
                                            <div className="space-y-3">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <div key={i} className="flex items-center justify-between p-4 bg-card border border-border/50 shadow-sm rounded-xl">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded bg-muted"></div>
                                                            <div>
                                                                <div className="w-24 h-3 bg-foreground/20 rounded mb-2"></div>
                                                                <div className="w-16 h-2 bg-muted-foreground/30 rounded"></div>
                                                            </div>
                                                        </div>
                                                        <div className="w-20 h-6 rounded-full bg-success/20 border border-success/30"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {activeModule === 2 && (
                                            <div className="grid grid-cols-2 gap-4 h-full">
                                                <div className="col-span-2 h-32 bg-gradient-to-r from-accent/20 to-primary/20 rounded-xl border border-accent/20 p-6 flex flex-col justify-center">
                                                    <div className="w-1/3 h-6 bg-accent/40 rounded mb-4"></div>
                                                    <div className="w-1/2 h-3 bg-foreground/20 rounded"></div>
                                                </div>
                                                <div className="bg-card border border-border/50 rounded-xl p-4 h-48"></div>
                                                <div className="bg-card border border-border/50 rounded-xl p-4 h-48"></div>
                                            </div>
                                        )}
                                        {activeModule === 3 && (
                                            <div className="flex gap-4 h-full">
                                                <div className="w-1/2 flex flex-col gap-4">
                                                    <div className="h-1/2 bg-card border border-border/50 rounded-xl relative flex items-center justify-center">
                                                        <div className="w-24 h-24 rounded-full border-4 border-primary border-t-accent"></div>
                                                    </div>
                                                    <div className="h-1/2 bg-card border border-border/50 rounded-xl p-4"><div className="w-1/2 h-4 bg-muted rounded mb-4" /> <div className="w-full h-2 bg-muted rounded mb-2" /> <div className="w-3/4 h-2 bg-muted rounded" /></div>
                                                </div>
                                                <div className="w-1/2 bg-card border border-border/50 rounded-xl relative overflow-hidden">
                                                    <div className="absolute inset-x-4 bottom-4 h-48 flex items-end gap-2">
                                                        {[30, 50, 40, 70, 60, 90, 80].map((h, i) => (
                                                            <div key={i} className="flex-1 bg-primary/40 rounded-t hover:bg-primary transition-colors cursor-pointer" style={{ height: `${h}%` }}></div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
