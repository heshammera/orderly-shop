"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { StoreManagement } from '@/components/admin/StoreManagement';

export default function AdminStoresPage() {
    const { language } = useLanguage();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">
                    {language === 'ar' ? 'إدارة المتاجر' : 'Stores Management'}
                </h1>
                <p className="text-muted-foreground">
                    {language === 'ar' ? 'إدارة المتاجر المسجلة والتحكم في إعداداتها ورصيدها.' : 'Manage registered stores and control their settings and balance.'}
                </p>
            </div>

            <StoreManagement />
        </div>
    );
}
