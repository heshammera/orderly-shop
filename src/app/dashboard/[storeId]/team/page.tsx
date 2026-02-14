"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { TeamManagement } from '@/components/dashboard/TeamManagement';

export default function TeamPage({ params }: { params: { storeId: string } }) {
    const { language } = useLanguage();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">
                    {language === 'ar' ? 'فريق العمل' : 'Team Members'}
                </h1>
                <p className="text-muted-foreground">
                    {language === 'ar' ? 'إدارة فريق المتجر والصلاحيات' : 'Manage store team and permissions'}
                </p>
            </div>

            <TeamManagement storeId={params.storeId} />
        </div>
    );
}
