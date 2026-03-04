"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { landingDataAr, landingDataEn } from '@/lib/landing-data';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeInUp, staggerContainer } from '@/lib/motion';
import Head from 'next/head';

export function FAQSection() {
    const { language } = useLanguage();
    const data = language === 'ar' ? landingDataAr.faq : landingDataEn.faq;
    const rtl = language === 'ar';

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleOpen = (idx: number) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    // Structured Data for SEO
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": data.items.map((item) => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
            }
        }))
    };

    return (
        <section id="faq" className="py-24 bg-card relative overflow-hidden">

            {/* Injecting Schema Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            <div className="container mx-auto px-4 max-w-4xl">

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeInUp}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl font-black mb-6 text-foreground tracking-tight">
                        {data.title}
                    </h2>
                    <p className="text-xl text-muted-foreground">
                        {data.subtitle}
                    </p>
                </motion.div>

                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="flex flex-col gap-4"
                >
                    {data.items.map((item, idx) => {
                        const isOpen = openIndex === idx;

                        return (
                            <motion.div
                                key={item.id}
                                variants={fadeInUp}
                                className="rounded-2xl border border-border/60 bg-background overflow-hidden hover:border-primary/30 transition-colors"
                            >
                                <button
                                    onClick={() => toggleOpen(idx)}
                                    className="w-full flex items-center justify-between p-6 text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                    aria-expanded={isOpen}
                                >
                                    <span className={cn("text-lg font-bold transition-colors pr-4 rtl:pl-4", isOpen ? "text-primary" : "text-foreground")}>
                                        {item.question}
                                    </span>
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                                        isOpen ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    </div>
                                </button>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                        >
                                            <div className="px-6 pb-6 pt-0 text-muted-foreground leading-relaxed">
                                                {item.answer}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
