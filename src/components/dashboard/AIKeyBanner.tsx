'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIKeyBannerProps {
    storeId: string;
}

export function AIKeyBanner({ storeId }: AIKeyBannerProps) {
    const { language } = useLanguage();

    return (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm mb-6">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="text-amber-800 flex-1">
                {language === 'ar'
                    ? 'لم تقم بربط مفتاح Gemini AI الخاص بك بعد. الرجاء إضافته من الإعدادات للاستفادة الكاملة من هذه الميزة.'
                    : 'You haven\'t linked your Gemini AI key yet. Please add it from Settings to fully utilize this feature.'}
            </span>
            <Link href={`/dashboard/${storeId}/settings?tab=ai`}>
                <Button size="sm" variant="outline" className="shrink-0 text-amber-700 border-amber-300 hover:bg-amber-100">
                    {language === 'ar' ? 'إضافة المفتاح' : 'Add Key'}
                </Button>
            </Link>
        </div>
    );
}
