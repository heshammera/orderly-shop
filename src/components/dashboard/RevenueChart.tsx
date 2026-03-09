"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
    storeId: string;
    currency: string;
    dateRange?: string;
}

export function RevenueChart({ storeId, currency, dateRange = '30d' }: RevenueChartProps) {
    const supabase = createClient();
    const { language } = useLanguage();
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRevenueData();
    }, [storeId, dateRange]);

    const fetchRevenueData = async () => {
        setIsLoading(true);
        try {
            let days = 30;
            if (dateRange === '7d') days = 7;
            if (dateRange === '90d') days = 90;
            if (dateRange === '180d') days = 180;
            if (dateRange === '365d') days = 365;

            const startDate = subDays(new Date(), days).toISOString();

            const { data: orders } = await supabase
                .from('orders')
                .select('created_at, total')
                .eq('store_id', storeId)
                .gte('created_at', startDate)
                .in('status', ['pending', 'completed', 'delivered', 'processing', 'shipped']);

            // Pre-fill all dates in range with 0 to ensure full chart rendering
            const grouped: Record<string, { date: string; revenue: number; count: number }> = {};
            for (let i = 0; i < days; i++) {
                const day = format(subDays(new Date(), days - i - 1), 'yyyy-MM-dd');
                grouped[day] = { date: day, revenue: 0, count: 0 };
            }

            orders?.forEach((order) => {
                const day = format(new Date(order.created_at), 'yyyy-MM-dd');
                if (grouped[day]) {
                    grouped[day].revenue += order.total;
                    grouped[day].count += 1;
                }
            });

            const chartArray = Object.values(grouped).sort((a: any, b: any) =>
                a.date.localeCompare(b.date)
            );

            setChartData(chartArray);
        } catch (error) {
            console.error('Error fetching revenue data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getTitle = () => {
        const ranges: Record<string, { ar: string, en: string }> = {
            '7d': { ar: 'الإيرادات - آخر 7 أيام', en: 'Revenue - Last 7 Days' },
            '30d': { ar: 'الإيرادات - آخر 30 يوم', en: 'Revenue - Last 30 Days' },
            '90d': { ar: 'الإيرادات - آخر 3 أشهر', en: 'Revenue - Last 3 Months' },
            '180d': { ar: 'الإيرادات - آخر 6 أشهر', en: 'Revenue - Last 6 Months' },
            '365d': { ar: 'الإيرادات - آخر 12 شهرًا', en: 'Revenue - Last 12 Months' },
        };
        return language === 'ar' ? ranges[dateRange]?.ar : ranges[dateRange]?.en;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
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
                            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                                    formatter={(value: number) => [`${value.toFixed(2)} ${currency}`, language === 'ar' ? 'الإيرادات' : 'Revenue']}
                                    labelFormatter={(label) => format(new Date(label), 'PPP')}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar
                                    dataKey="revenue"
                                    fill="hsl(var(--primary))"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={50}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
