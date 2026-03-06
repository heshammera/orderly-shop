"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle } from 'lucide-react';
import Link from 'next/link';

interface TutorialCardProps {
    tutorial: {
        id: string;
        title: { ar: string; en: string } | string;
        description?: { ar: string; en: string } | string;
        thumbnail_url?: string;
        category?: { name: { ar: string; en: string } } | null;
        slug: string;
    };
    baseHref: string; // e.g. '/tutorials' or '/dashboard/STORE_ID/tutorials'
}

export function TutorialCard({ tutorial, baseHref }: TutorialCardProps) {
    const { language, dir } = useLanguage();

    const getLocalized = (val: any) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        return val[language] || val.ar || val.en || '';
    };

    const title = getLocalized(tutorial.title);
    const description = getLocalized(tutorial.description);
    const categoryName = tutorial.category ? getLocalized(tutorial.category.name) : null;

    return (
        <Link href={`${baseHref}/${tutorial.slug}`} className="block group">
            <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-slate-200 hover:ring-primary/50 bg-white h-full flex flex-col">
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    {tutorial.thumbnail_url ? (
                        <img
                            src={tutorial.thumbnail_url}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white/50">
                            <PlayCircle className="w-12 h-12" />
                        </div>
                    )}

                    {/* Dark overlay with play button on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center backdrop-blur-sm transform scale-75 group-hover:scale-100 transition-transform duration-300">
                            <PlayCircle className="w-7 h-7" />
                        </div>
                    </div>

                    {categoryName && (
                        <div className={`absolute top-3 ${dir === 'rtl' ? 'right-3' : 'left-3'}`}>
                            <span className="px-2.5 py-1 text-xs font-semibold bg-white/90 backdrop-blur-md text-slate-800 rounded-full shadow-sm">
                                {categoryName}
                            </span>
                        </div>
                    )}
                </div>

                <CardContent className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg text-slate-900 line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    {description && (
                        <p className="text-sm text-slate-500 line-clamp-2 mt-auto">
                            {description}
                        </p>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}
