"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { PriceRangeFilter } from '@/components/store/PriceRangeFilter';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface Category {
    id: string;
    name: { ar: string; en: string };
    parent_id: string | null;
}

interface AdvancedFiltersProps {
    categories: Category[];
    currency: string;
}

export function AdvancedFilters({ categories, currency }: AdvancedFiltersProps) {
    const { language } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const selectedCategory = searchParams.get('category');

    const handleCategorySelect = (categoryId: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (categoryId) {
            params.set('category', categoryId);
        } else {
            params.delete('category');
        }
        params.delete('page');
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="space-y-8">
            {/* Categories Filter */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">{language === 'ar' ? 'التصنيفات' : 'Categories'}</h3>
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    <Button
                        variant={!selectedCategory ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-sm h-9"
                        onClick={() => handleCategorySelect(null)}
                    >
                        {language === 'ar' ? 'كل المنتجات' : 'All Products'}
                    </Button>

                    {categories.filter(c => !c.parent_id).map((category) => (
                        <div key={category.id} className="space-y-1">
                            <Button
                                variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
                                className="w-full justify-start text-sm h-9 font-medium"
                                onClick={() => handleCategorySelect(category.id)}
                            >
                                {category.name[language] || category.name.ar}
                            </Button>

                            {/* Sub-categories */}
                            {categories.filter(c => c.parent_id === category.id).map((sub) => (
                                <Button
                                    key={sub.id}
                                    variant={selectedCategory === sub.id ? 'secondary' : 'ghost'}
                                    className="w-full justify-start text-sm h-8 ps-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleCategorySelect(sub.id)}
                                >
                                    {sub.name[language] || sub.name.ar}
                                </Button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">{language === 'ar' ? 'السعر' : 'Price'}</h3>
                <PriceRangeFilter currency={currency} />
            </div>

            {/* Additional Custom Filters (e.g. Size, Color) can be added here in the future based on Variant properties */}
        </div>
    );
}
