"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TutorialCard } from '@/components/tutorials/TutorialCard';
import { ArrowLeft, ArrowRight, PlayCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseParams = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
};
const supabase = createClient(supabaseParams.url, supabaseParams.key);

interface Tutorial {
    id: string;
    title: { ar: string; en: string };
    description: { ar: string; en: string };
    thumbnail_url: string;
    category_id: string;
    slug: string;
    category?: { name: { ar: string; en: string } };
}

export function TutorialsSection() {
    const { language, dir } = useLanguage();
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTutorials() {
            try {
                // Fetch latest 4 published tutorials that can be shown in listings
                const { data, error } = await supabase
                    .from('tutorials')
                    .select(`
                        id, title, description, thumbnail_url, category_id, slug,
                        category:category_id (name)
                    `)
                    .eq('is_published', true)
                    .neq('display_mode', 'standalone')
                    .order('created_at', { ascending: false })
                    .limit(4);

                if (!error && data) {
                    const formattedData = data.map((t: any) => ({
                        ...t,
                        category: Array.isArray(t.category) ? t.category[0] : t.category
                    }));
                    setTutorials(formattedData);
                }
            } catch (err) {
                console.error('Error fetching tutorials section:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchTutorials();
    }, []);

    if (loading || tutorials.length === 0) {
        return null; // hide section if no tutorials or still loading
    }

    return (
        <section className="py-24 bg-white relative overflow-hidden" dir={dir}>
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
                    <div className="space-y-4 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            <BookOpen className="w-4 h-4" />
                            <span>{language === 'ar' ? 'تعلم معنا' : 'Learn with us'}</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                            {language === 'ar' ? 'شروحات ودلائل المنصة' : 'Platform Tutorials & Guides'}
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            {language === 'ar'
                                ? 'اكتشف كيف تدير متجرك باحترافية وتزيد من مبيعاتك عبر مكتبة الشروحات المرئية.'
                                : 'Discover how to professionally manage your store and increase sales with our video tutorials.'}
                        </p>
                    </div>

                    <Link
                        href="/tutorials"
                        className="group inline-flex items-center gap-2 justify-center px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 hover:border-primary hover:text-primary transition-all duration-300 rounded-full font-bold shadow-sm hover:shadow-md"
                    >
                        {language === 'ar' ? 'تصفح كل الشروحات' : 'Browse All Tutorials'}
                        {dir === 'rtl' ? (
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        ) : (
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        )}
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tutorials.map(tutorial => (
                        <TutorialCard
                            key={tutorial.id}
                            tutorial={tutorial}
                            baseHref="/tutorials"
                        />
                    ))}
                </div>

                {/* Mobile 'View all' fallback if grid breaks it visually */}
                <div className="mt-10 flex justify-center sm:hidden">
                    <Link
                        href="/tutorials"
                        className="inline-flex items-center gap-2 text-primary font-bold hover:text-primary/80 transition-colors"
                    >
                        {language === 'ar' ? 'عرض المزيد' : 'View More'}
                        {dir === 'rtl' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </Link>
                </div>
            </div>
        </section>
    );
}
