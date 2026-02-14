"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { CustomersTable } from '@/components/dashboard/CustomersTable';

export default function CustomersPage({ params }: { params: { storeId: string } }) {
    const { language } = useLanguage();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">
                    {language === 'ar' ? 'العملاء' : 'Customers'}
                </h1>
                <p className="text-muted-foreground">
                    {language === 'ar' ? 'إدارة قاعدة بيانات العملاء' : 'Manage your customer base'}
                </p>
            </div>

            <CustomersTable storeId={params.storeId} />
        </div>
    );
}
