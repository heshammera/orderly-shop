"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { IntegrationsManager } from '@/components/dashboard/IntegrationsManager';

export default function IntegrationsPage({ params }: { params: { storeId: string } }) {
    const { language } = useLanguage();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">
                    {language === 'ar' ? 'الربط والتكامل' : 'Integrations'}
                </h1>
                <p className="text-muted-foreground">
                    {language === 'ar' ? 'ربط متجرك مع خدمات خارجية' : 'Connect with third-party services'}
                </p>
            </div>

            <IntegrationsManager storeId={params.storeId} />
        </div>
    );
}
