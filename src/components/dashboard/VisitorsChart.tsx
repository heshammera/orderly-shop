"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VisitorsChartProps {
    storeId: string;
    dateRange?: string;
}

export function VisitorsChart({ storeId, dateRange = '30d' }: VisitorsChartProps) {
    const supabase = createClient();
    const { language } = useLanguage();
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchVisitorsData();
    }, [storeId, dateRange]);

    const fetchVisitorsData = async () => {
        setIsLoading(true);
        try {
            let days = 30;
            if (dateRange === '7d') days = 7;
            if (dateRange === '90d') days = 90;
            if (dateRange === '180d') days = 180;
            if (dateRange === '365d') days = 365;

            const startDate = subDays(new Date(), days).toISOString();

            // Fetch store visits
            const { data: visits } = await supabase
                .from('store_visits')
                .select('created_at')
                .eq('store_id', storeId)
                .gte('created_at', startDate);

            // Group by day
            const grouped = visits?.reduce((acc: any, visit) => {
                const day = format(new Date(visit.created_at), 'yyyy-MM-dd');
                if (!acc[day]) {
                    acc[day] = { date: day, visitors: 0 };
                }
                acc[day].visitors += 1;
                return acc;
            }, {});

            let chartArray = Object.values(grouped || {}).sort((a: any, b: any) =>
                a.date.localeCompare(b.date)
            );

            // If no actual tracking data, create a mock array just to show the UI functions
            // Wait, we can just leave it empty. Let's make it look nice if there's no data yet.
            if (chartArray.length === 0) {
                chartArray = Array.from({ length: days }).map((_, i) => {
                    return {
                        date: format(subDays(new Date(), days - i - 1), 'yyyy-MM-dd'),
                        visitors: 0 // Show 0 instead of mock data so it's accurate
                    };
                });
            }

            setChartData(chartArray);
        } catch (error) {
            console.error('Error fetching visitors data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getTitle = () => {
        const ranges: Record<string, { ar: string, en: string }> = {
            '7d': { ar: 'زيارات المتجر - آخر 7 أيام', en: 'Store Visits - Last 7 Days' },
            '30d': { ar: 'زيارات المتجر - آخر 30 يوم', en: 'Store Visits - Last 30 Days' },
            '90d': { ar: 'زيارات المتجر - آخر 3 أشهر', en: 'Store Visits - Last 3 Months' },
            '180d': { ar: 'زيارات المتجر - آخر 6 أشهر', en: 'Store Visits - Last 6 Months' },
            '365d': { ar: 'زيارات المتجر - آخر 12 شهرًا', en: 'Store Visits - Last 12 Months' },
        };
        return language === 'ar' ? ranges[dateRange]?.ar : ranges[dateRange]?.en;
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {getTitle()}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="h-[350px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(val) => format(new Date(val), 'MMM dd')}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                                />
                                <Tooltip
                                    formatter={(value: number) => [`${value}`, language === 'ar' ? 'الزيارات' : 'Visits']}
                                    labelFormatter={(label) => format(new Date(label), 'PPP')}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="visitors"
                                    stroke="hsl(var(--primary))"
                                    fillOpacity={1}
                                    fill="url(#colorVisits)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
