"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { TopProductsWidget } from '@/components/dashboard/TopProductsWidget';
import { AdvancedAnalyticsStats } from '@/components/dashboard/AdvancedAnalyticsStats';

export default function AnalyticsPage({ params }: { params: { storeId: string } }) {
    const { language } = useLanguage();
    const [currency, setCurrency] = useState('SAR');
    const supabase = createClient();

    useEffect(() => {
        const fetchStoreCurrency = async () => {
            const { data } = await supabase
                .from('stores')
                .select('currency')
                .eq('id', params.storeId)
                .single();
            if (data?.currency) {
                setCurrency(data.currency);
            }
        };
        fetchStoreCurrency();
    }, [params.storeId]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">
                    {language === 'ar' ? 'التحليلات' : 'Analytics'}
                </h1>
                <p className="text-muted-foreground">
                    {language === 'ar' ? 'عرض تفاصيل وأرقام المتجر' : 'View detailed store analytics and insights'}
                </p>
            </div>

            <AdvancedAnalyticsStats storeId={params.storeId} currency={currency} />
            <RevenueChart storeId={params.storeId} />
            <TopProductsWidget storeId={params.storeId} currency={currency} />
        </div>
    );
}
