"use client";

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export function SortDropdown() {
    const { language } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentSort = searchParams.get('sort') || 'newest';

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('sort', value);
        params.delete('page'); // Always reset to page 1 on sort change
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const sortOptions = [
        { value: 'newest', labelAr: 'الأحدث', labelEn: 'Newest' },
        { value: 'price_asc', labelAr: 'السعر: من الأقل للأعلى', labelEn: 'Price: Low to High' },
        { value: 'price_desc', labelAr: 'السعر: من الأعلى للأقل', labelEn: 'Price: High to Low' },
    ];

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline-block">
                {language === 'ar' ? 'ترتيب حسب:' : 'Sort by:'}
            </span>
            <Select value={currentSort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px] bg-white text-sm h-9">
                    <SelectValue placeholder={language === 'ar' ? 'ترتيب' : 'Sort'} />
                </SelectTrigger>
                <SelectContent>
                    {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {language === 'ar' ? option.labelAr : option.labelEn}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
