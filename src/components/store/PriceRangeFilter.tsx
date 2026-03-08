"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';

interface PriceRangeFilterProps {
    currency: string;
}

export function PriceRangeFilter({ currency }: PriceRangeFilterProps) {
    const { language } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const initialMin = searchParams.get('minPrice') || '';
    const initialMax = searchParams.get('maxPrice') || '';

    const [minPrice, setMinPrice] = useState(initialMin);
    const [maxPrice, setMaxPrice] = useState(initialMax);

    // Synchronize state with URL changes in case they are cleared elsewhere
    useEffect(() => {
        setMinPrice(searchParams.get('minPrice') || '');
        setMaxPrice(searchParams.get('maxPrice') || '');
    }, [searchParams]);

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString());

        if (minPrice && !isNaN(Number(minPrice))) {
            params.set('minPrice', minPrice);
        } else {
            params.delete('minPrice');
        }

        if (maxPrice && !isNaN(Number(maxPrice))) {
            params.set('maxPrice', maxPrice);
        } else {
            params.delete('maxPrice');
        }

        params.delete('page'); // Reset to first page
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handleClear = () => {
        setMinPrice('');
        setMaxPrice('');
        const params = new URLSearchParams(searchParams.toString());
        params.delete('minPrice');
        params.delete('maxPrice');
        params.delete('page');
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-900">{language === 'ar' ? 'نطاق السعر' : 'Price Range'}</h4>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {currency}
                    </span>
                    <Input
                        type="number"
                        placeholder={language === 'ar' ? 'من' : 'Min'}
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="ps-10 text-sm h-9"
                    />
                </div>
                <span className="text-muted-foreground">-</span>
                <div className="relative flex-1">
                    <span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {currency}
                    </span>
                    <Input
                        type="number"
                        placeholder={language === 'ar' ? 'إلى' : 'Max'}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="ps-10 text-sm h-9"
                    />
                </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
                <Button
                    onClick={handleApply}
                    size="sm"
                    className="w-full text-xs h-8"
                >
                    {language === 'ar' ? 'تطبيق' : 'Apply'}
                </Button>
                {(initialMin || initialMax) && (
                    <Button
                        onClick={handleClear}
                        size="sm"
                        variant="ghost"
                        className="text-xs h-8 px-2 text-muted-foreground"
                    >
                        {language === 'ar' ? 'مسح' : 'Clear'}
                    </Button>
                )}
            </div>
        </div>
    );
}
