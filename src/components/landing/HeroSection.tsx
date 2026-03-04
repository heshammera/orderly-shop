"use client";

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { landingDataAr, landingDataEn } from '@/lib/landing-data';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Play, CheckCircle2, LayoutDashboard, ShoppingCart, Package, Users, Settings, Search, Bell, TrendingUp, DollarSign, Eye, X } from 'lucide-react';
import Link from 'next/link';
import { fadeInUp, staggerContainer, slideInBottom } from '@/lib/motion';
import { cn } from '@/lib/utils';

// Dashboard mockup data per language
const dashboardContent = {
    ar: {
        overview: 'نظرة عامة',
        searchPlaceholder: 'ابحث عن أي شيء...',
        sidebar: [
            { label: 'لوحة التحكم', active: true },
            { label: 'الطلبات' },
            { label: 'المنتجات' },
            { label: 'العملاء' },
            { label: 'الإعدادات' },
        ],
        stats: [
            { title: 'إجمالي الإيرادات', value: '٤٥,٢٣١.٨٩$', trend: '+٢٠.١٪' },
            { title: 'الطلبات النشطة', value: '٥٧٣', trend: '+١٢.٥٪' },
            { title: 'مشاهدات المتجر', value: '١٢,٢٣٤', trend: '+١٩.٢٪' },
        ],
        chartTitle: 'نظرة عامة على المبيعات',
        recentTitle: 'المبيعات الأخيرة',
        trendSuffix: 'عن الشهر الماضي',
        recentSales: [
            { name: 'سارة م.', amount: '+٢٤٠$', time: 'منذ ٢ د' },
            { name: 'أحمد ك.', amount: '+١,٤٣٠$', time: 'منذ ١٥ د' },
            { name: 'يوسف د.', amount: '+٩٩$', time: 'منذ ١ س' },
            { name: 'نورا ع.', amount: '+٥٤٩$', time: 'منذ ٢ س' },
        ],
    },
    en: {
        overview: 'Overview',
        searchPlaceholder: 'Search anything...',
        sidebar: [
            { label: 'Dashboard', active: true },
            { label: 'Orders' },
            { label: 'Products' },
            { label: 'Customers' },
            { label: 'Settings' },
        ],
        stats: [
            { title: 'Total Revenue', value: '$45,231.89', trend: '+20.1%' },
            { title: 'Active Orders', value: '573', trend: '+12.5%' },
            { title: 'Store Views', value: '12,234', trend: '+19.2%' },
        ],
        chartTitle: 'Sales Overview',
        recentTitle: 'Recent Sales',
        trendSuffix: 'from last month',
        recentSales: [
            { name: 'Sarah M.', amount: '+$240', time: '2m ago' },
            { name: 'Ahmad K.', amount: '+$1,430', time: '15m ago' },
            { name: 'John D.', amount: '+$99', time: '1h ago' },
            { name: 'Emma W.', amount: '+$549', time: '2h ago' },
        ],
    },
};

const sidebarIcons = [LayoutDashboard, ShoppingCart, Package, Users, Settings];
const statIcons = [DollarSign, ShoppingCart, Eye];

export function HeroSection() {
    const { language, dir } = useLanguage();
    const data = language === 'ar' ? landingDataAr.hero : landingDataEn.hero;
    const dashboard = dashboardContent[language];
    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const isRtl = dir === 'rtl';

    return (
        <>
            <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden bg-background">
                {/* Animated Background Mesh Gradient */}
                <div className="absolute inset-0 mesh-gradient opacity-80 dark:opacity-40 animate-gradient-shift"></div>

                {/* Decorative Grid */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none"></div>

                <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">

                    {/* Main Content */}
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="text-center max-w-4xl mx-auto flex flex-col items-center"
                    >
                        {/* Badge */}
                        <motion.div
                            variants={fadeInUp}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8 border border-primary/20 shadow-soft backdrop-blur-sm"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            <span className="text-sm font-semibold">{data.badge}</span>
                        </motion.div>

                        {/* Title */}
                        <motion.h1
                            variants={fadeInUp}
                            className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.15]"
                        >
                            {data.titleHeadline} <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-500 to-accent relative inline-block">
                                {data.titleHighlight}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shine_3s_infinite] -skew-x-12 opacity-0 hover:opacity-100 transition-opacity"></div>
                            </span>
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            variants={fadeInUp}
                            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed"
                        >
                            {data.subtitle}
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            variants={fadeInUp}
                            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
                        >
                            <Link href="/signup" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-full gradient-primary text-white shadow-glow hover:scale-105 transition-all text-lg border-0 group">
                                    {data.primaryCta}
                                    <ArrowIcon className={cn("ml-2 h-5 w-5 transition-transform", dir === 'rtl' ? "mr-2 ml-0 group-hover:-translate-x-1" : "group-hover:translate-x-1")} />
                                </Button>
                            </Link>

                            <Button onClick={() => setIsVideoOpen(true)} variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 rounded-full bg-background/50 backdrop-blur-md hover:bg-background/80 transition-all text-lg group">
                                <Play className={cn("h-5 w-5 text-primary", dir === 'rtl' ? "ml-2" : "mr-2")} />
                                {data.secondaryCta}
                            </Button>
                        </motion.div>

                        {/* Trust Text */}
                        <motion.div
                            variants={fadeInUp}
                            className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground font-medium"
                        >
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span>{data.trustText}</span>
                        </motion.div>
                    </motion.div>

                    {/* Floating Dashboard Mockup - Dynamic Language */}
                    <motion.div
                        variants={slideInBottom}
                        initial="hidden"
                        animate="visible"
                        className="w-full max-w-5xl mx-auto mt-20 relative px-4 sm:px-0"
                    >
                        <div className="relative rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl overflow-hidden animate-float">
                            {/* Browser Header */}
                            <div className="h-10 border-b border-border/50 bg-muted/30 flex items-center px-4 gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                                </div>
                            </div>
                            {/* Mockup Content - Dynamic Dashboard */}
                            <div className={cn("aspect-[16/9] w-full bg-background/60 p-6 flex flex-col font-sans relative overflow-hidden", isRtl ? "text-right" : "text-left")} dir={isRtl ? "rtl" : "ltr"}>
                                {/* Dashboard Top Header */}
                                <div className="flex justify-between items-center w-full mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <div className="w-4 h-4 bg-primary rounded-sm"></div>
                                        </div>
                                        <div className="font-bold text-foreground opacity-80 text-sm">{dashboard.overview}</div>
                                    </div>
                                    <div className={cn("flex gap-4 items-center", isRtl && "flex-row-reverse")}>
                                        <div className={cn("w-48 h-9 bg-background border border-border/50 rounded-md flex items-center px-3 text-muted-foreground/50 shadow-sm relative hidden sm:flex", isRtl && "flex-row-reverse")}>
                                            <Search className={cn("w-4 h-4 absolute", isRtl ? "right-3" : "left-3")} />
                                            <div className={cn("text-xs font-medium", isRtl ? "pr-6" : "pl-6")}>{dashboard.searchPlaceholder}</div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-background border border-border/50 flex items-center justify-center text-muted-foreground/80 shadow-sm">
                                            <Bell className="w-4 h-4" />
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent border border-border/50 shadow-sm relative">
                                            <div className={cn("absolute -bottom-1 w-3 h-3 bg-success border-2 border-background rounded-full", isRtl ? "-left-1" : "-right-1")}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Body mock */}
                                <div className={cn("flex gap-6 h-full flex-1", isRtl && "flex-row-reverse")}>
                                    {/* Sidebar */}
                                    <div className={cn("w-[40px] md:w-[160px] h-full flex flex-col gap-2", isRtl ? "border-l border-border/50 pl-4" : "border-r border-border/50 pr-4")}>
                                        {dashboard.sidebar.map((item, i) => {
                                            const Icon = sidebarIcons[i];
                                            return (
                                                <div key={i} className={cn("flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors", item.active ? "bg-primary/10 text-primary" : "text-muted-foreground/80 hover:bg-muted/50")}>
                                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                                    <span className="hidden md:inline-block">{item.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Main content */}
                                    <div className="flex-1 flex flex-col gap-5">
                                        {/* Stats Cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {dashboard.stats.map((stat, i) => {
                                                const Icon = statIcons[i];
                                                return (
                                                    <div key={i} className={cn("bg-background border border-border/50 shadow-sm rounded-xl p-4 flex flex-col gap-2", i > 0 ? "hidden sm:flex" : "flex")}>
                                                        <div className="flex justify-between items-center text-muted-foreground/80">
                                                            <span className="text-xs font-semibold">{stat.title}</span>
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div className="text-xl font-bold text-foreground">{stat.value}</div>
                                                        <div className={cn("flex items-center text-[10px] text-emerald-500 font-medium", isRtl && "flex-row-reverse justify-end gap-1")}>
                                                            <TrendingUp className={cn("w-3 h-3", isRtl ? "ml-1" : "mr-1")} />
                                                            {stat.trend} {dashboard.trendSuffix}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Chart & Recent */}
                                        <div className={cn("flex gap-4 flex-1", isRtl && "flex-row-reverse")}>
                                            {/* Chart Area */}
                                            <div className="flex-[2] bg-background border border-border/50 shadow-sm rounded-xl p-4 flex flex-col">
                                                <div className="font-semibold text-xs mb-4 text-foreground/80">{dashboard.chartTitle}</div>
                                                <div className="flex-1 flex items-end gap-2 relative">
                                                    {/* Y-axis lines */}
                                                    <div className="absolute inset-0 flex flex-col justify-between border-y border-border/30 z-0">
                                                        <div className="w-full h-px border-b border-dashed border-border/50"></div>
                                                        <div className="w-full h-px border-b border-dashed border-border/50"></div>
                                                        <div className="w-full h-px border-b border-dashed border-border/50"></div>
                                                    </div>

                                                    {/* Bars */}
                                                    {[40, 70, 45, 90, 65, 85, 100, 60, 45, 80, 50, 75].map((h, i) => (
                                                        <div key={i} className="flex-1 bg-primary/20 hover:bg-primary/50 transition-colors z-10 rounded-t-sm relative group cursor-pointer" style={{ height: `${h}%` }}>
                                                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden sm:block">
                                                                ${(h * 120).toFixed(0)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Recent Activity */}
                                            <div className="flex-[1] bg-background border border-border/50 shadow-sm rounded-xl p-4 flex-col gap-3 overflow-hidden hidden md:flex">
                                                <div className="font-semibold text-xs mb-1 text-foreground/80">{dashboard.recentTitle}</div>
                                                {dashboard.recentSales.map((activity, i) => (
                                                    <div key={i} className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 flex items-center justify-center text-[8px] font-bold text-primary">
                                                                {activity.name.charAt(0)}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-semibold text-foreground/80 leading-tight">{activity.name}</span>
                                                                <span className="text-[9px] text-muted-foreground/60 leading-tight">{activity.time}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-[10px] font-bold text-emerald-500">
                                                            {activity.amount}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Decorative blur elements around the mockup */}
                        <div className="absolute -z-10 top-1/2 left-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute -z-10 top-1/2 right-0 w-72 h-72 bg-accent/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
                    </motion.div>
                </div>
            </section>

            {/* Video Modal for demo2.mp4 */}
            <AnimatePresence>
                {isVideoOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setIsVideoOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsVideoOpen(false)}
                                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <video
                                src="/videos/demo2.mp4"
                                className="w-full h-full object-cover"
                                controls
                                autoPlay
                                playsInline
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
