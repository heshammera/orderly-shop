"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { TopProductsWidget } from '@/components/dashboard/TopProductsWidget';
import { AdvancedAnalyticsStats } from '@/components/dashboard/AdvancedAnalyticsStats';
import { SalesByCategoryChart } from '@/components/dashboard/SalesByCategoryChart';
import { VisitorsChart } from '@/components/dashboard/VisitorsChart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { exportStoreReport } from '@/lib/exportReport';
import { toast } from 'sonner';

export default function AnalyticsPage({ params }: { params: { storeId: string } }) {
    const { language } = useLanguage();
    const [currency, setCurrency] = useState('SAR');
    const [dateRange, setDateRange] = useState('30d');
    const [isExporting, setIsExporting] = useState(false);
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

    const handleExport = async () => {
        setIsExporting(true);
        const result = await exportStoreReport(params.storeId, dateRange, language);
        if (result.success) {
            toast.success(language === 'ar' ? 'تم تصدير التقرير بنجاح' : 'Report exported successfully');
        } else {
            toast.error(result.message || (language === 'ar' ? 'حدث خطأ أثناء التصدير' : 'Export failed'));
        }
        setIsExporting(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">
                        {language === 'ar' ? 'التحليلات' : 'Analytics'}
                    </h1>
                    <p className="text-muted-foreground">
                        {language === 'ar' ? 'عرض تفاصيل وأرقام المتجر' : 'View detailed store analytics and insights'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">{language === 'ar' ? 'آخر 7 أيام' : 'Last 7 Days'}</SelectItem>
                            <SelectItem value="30d">{language === 'ar' ? 'آخر 30 يوم' : 'Last 30 Days'}</SelectItem>
                            <SelectItem value="90d">{language === 'ar' ? 'آخر 3 أشهر' : 'Last 3 Months'}</SelectItem>
                            <SelectItem value="180d">{language === 'ar' ? 'آخر 6 أشهر' : 'Last 6 Months'}</SelectItem>
                            <SelectItem value="365d">{language === 'ar' ? 'آخر 12 شهرًا' : 'Last 12 Months'}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                        {isExporting ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Download className="w-4 h-4 me-2" />}
                        {language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
                    </Button>
                </div>
            </div>

            <AdvancedAnalyticsStats storeId={params.storeId} currency={currency} dateRange={dateRange} />

            <div className="grid gap-6 md:grid-cols-2">
                <RevenueChart storeId={params.storeId} currency={currency} dateRange={dateRange} />
                <SalesByCategoryChart storeId={params.storeId} currency={currency} dateRange={dateRange} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <VisitorsChart storeId={params.storeId} dateRange={dateRange} />
                <TopProductsWidget storeId={params.storeId} currency={currency} dateRange={dateRange} />
            </div>
        </div>
    );
}
