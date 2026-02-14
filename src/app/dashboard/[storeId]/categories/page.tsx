"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { CategoriesTable } from '@/components/dashboard/CategoriesTable';

export default function CategoriesPage({ params }: { params: { storeId: string } }) {
    const { language } = useLanguage();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">
                    {language === 'ar' ? 'التصنيفات' : 'Categories'}
                </h1>
                <p className="text-muted-foreground">
                    {language === 'ar' ? 'تنظيم المنتجات في تصنيفات' : 'Organize products into categories'}
                </p>
            </div>

            <CategoriesTable storeId={params.storeId} />
        </div>
    );
}
