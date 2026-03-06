"use client";

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, ArrowRight, Play, BookOpen, X, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import useEmblaCarousel from 'embla-carousel-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { VideoPlayer } from '@/components/tutorials/VideoPlayer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    video_url: string;
    video_type: string;
    category_id: string;
    slug: string;
    category?: { name: { ar: string; en: string } };
}

export function TutorialsSection() {
    const { language, dir } = useLanguage();
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        direction: dir as 'ltr' | 'rtl',
        align: 'start',
        skipSnaps: false
    });

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

    useEffect(() => {
        async function fetchTutorials() {
            try {
                // 1. First try to fetch featured tutorials
                let { data, error } = await supabase
                    .from('tutorials')
                    .select(`
                        id, title, description, thumbnail_url, video_url, video_type, category_id, slug,
                        category:category_id (name)
                    `)
                    .eq('is_published', true)
                    .eq('is_featured', true)
                    .order('sort_order', { ascending: true })
                    .limit(10);

                // 2. Fallback: if no featured found, show most recent published tutorials
                if (!error && (!data || data.length === 0)) {
                    const result = await supabase
                        .from('tutorials')
                        .select(`
                            id, title, description, thumbnail_url, video_url, video_type, category_id, slug,
                            category:category_id (name)
                        `)
                        .eq('is_published', true)
                        .order('created_at', { ascending: false })
                        .limit(6);
                    data = result.data;
                    error = result.error;
                }

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
        return null;
    }

    return (
        <section className="py-24 bg-slate-50 relative overflow-hidden" dir={dir}>
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(var(--primary-rgb),0.05)_0%,transparent_50%)] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="space-y-4 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm">
                            <Play className="w-4 h-4 fill-current" />
                            <span>{language === 'ar' ? 'دروس فيديو تعليمية' : 'Video Tutorials'}</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            {language === 'ar' ? 'تعلم كيف تبني إمبراطوريتك التجارية' : 'Learn How to Build Your Business Empire'}
                        </h2>
                        <p className="text-xl text-slate-600 leading-relaxed max-w-xl">
                            {language === 'ar'
                                ? 'شروحات مبسطة خطوة بخطوة لمساعدتك في إطلاق وإدارة متجرك الإلكتروني بأفضل طريقة.'
                                : 'Simplified step-by-step guides to help you launch and manage your online store the best way.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex gap-2 mr-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={scrollPrev}
                                className="rounded-full w-12 h-12 border-slate-200 hover:border-primary hover:text-primary transition-all shadow-sm bg-white"
                            >
                                {dir === 'rtl' ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={scrollNext}
                                className="rounded-full w-12 h-12 border-slate-200 hover:border-primary hover:text-primary transition-all shadow-sm bg-white"
                            >
                                {dir === 'rtl' ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                            </Button>
                        </div>
                        <Link
                            href="/tutorials"
                            className="hidden sm:inline-flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 transition-all duration-300 rounded-2xl font-bold shadow-sm"
                        >
                            {language === 'ar' ? 'مركز التعليم' : 'Learning Center'}
                            {dir === 'rtl' ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                        </Link>
                    </div>
                </div>

                <div className="embla overflow-hidden -mx-4 px-4" ref={emblaRef}>
                    <div className="embla__container flex gap-6">
                        {tutorials.map((tutorial) => (
                            <div key={tutorial.id} className="embla__slide flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0">
                                <div
                                    className="group relative aspect-[16/10] rounded-3xl overflow-hidden bg-slate-200 shadow-xl cursor-pointer transform transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20"
                                    onClick={() => setSelectedTutorial(tutorial)}
                                >
                                    {tutorial.thumbnail_url ? (
                                        <img
                                            src={tutorial.thumbnail_url}
                                            alt=""
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                            <Play className="w-12 h-12 text-white/20" />
                                        </div>
                                    )}

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-100 transition-opacity">
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-75 group-hover:scale-100">
                                            <div className="w-20 h-20 rounded-full bg-primary/95 text-white flex items-center justify-center shadow-2xl shadow-primary/40">
                                                <Play className="w-8 h-8 fill-current ml-1" />
                                            </div>
                                        </div>

                                        <div className="absolute bottom-0 left-0 right-0 p-8">
                                            {tutorial.category && (
                                                <span className="inline-block px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md text-primary font-bold text-xs mb-3 border border-primary/20">
                                                    {tutorial.category.name[language as 'ar' | 'en'] || tutorial.category.name.ar}
                                                </span>
                                            )}
                                            <h3 className="text-xl font-bold text-white line-clamp-2 group-hover:text-primary transition-colors">
                                                {tutorial.title[language as 'ar' | 'en'] || tutorial.title.ar}
                                            </h3>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-16 text-center sm:hidden">
                    <Link
                        href="/tutorials"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20"
                    >
                        {language === 'ar' ? 'استكشف كل الشروحات' : 'Explore All Tutorials'}
                    </Link>
                </div>
            </div>

            {/* Video Modal */}
            <Dialog open={!!selectedTutorial} onOpenChange={(open) => !open && setSelectedTutorial(null)}>
                <DialogContent className="max-w-5xl p-0 overflow-hidden bg-black border-none rounded-3xl">
                    {selectedTutorial && (
                        <div className="relative">
                            <div className="p-4 bg-slate-900/50 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
                                <h3 className="text-white font-bold px-4">
                                    {selectedTutorial.title[language as 'ar' | 'en'] || selectedTutorial.title.ar}
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSelectedTutorial(null)}
                                    className="text-white hover:bg-white/10 rounded-full"
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                            <div className="aspect-video">
                                <VideoPlayer
                                    videoUrl={selectedTutorial.video_url}
                                    videoType={selectedTutorial.video_type}
                                    thumbnailUrl={selectedTutorial.thumbnail_url}
                                />
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}
