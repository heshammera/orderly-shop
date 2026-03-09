"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Loader2 } from 'lucide-react';
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
        fetchActivityData();
    }, [storeId, dateRange]);

    const fetchActivityData = async () => {
        setIsLoading(true);
        try {
            let days = 30;
            if (dateRange === '7d') days = 7;
            if (dateRange === '90d') days = 90;
            if (dateRange === '180d') days = 180;
            if (dateRange === '365d') days = 365;

            const startDate = subDays(new Date(), days).toISOString();

            // Use orders as activity data since store_visits may be empty
            const { data: orders } = await supabase
                .from('orders')
                .select('created_at')
                .eq('store_id', storeId)
                .gte('created_at', startDate);

            // Pre-fill all dates
            const grouped: Record<string, { date: string; orders: number }> = {};
            for (let i = 0; i < days; i++) {
                const day = format(subDays(new Date(), days - i - 1), 'yyyy-MM-dd');
                grouped[day] = { date: day, orders: 0 };
            }

            orders?.forEach((order) => {
                const day = format(new Date(order.created_at), 'yyyy-MM-dd');
                if (grouped[day]) {
                    grouped[day].orders += 1;
                }
            });

            const chartArray = Object.values(grouped).sort((a: any, b: any) =>
                a.date.localeCompare(b.date)
            );

            setChartData(chartArray);
        } catch (error) {
            console.error('Error fetching activity data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getTitle = () => {
        const ranges: Record<string, { ar: string, en: string }> = {
            '7d': { ar: 'نشاط الطلبات - آخر 7 أيام', en: 'Order Activity - Last 7 Days' },
            '30d': { ar: 'نشاط الطلبات - آخر 30 يوم', en: 'Order Activity - Last 30 Days' },
            '90d': { ar: 'نشاط الطلبات - آخر 3 أشهر', en: 'Order Activity - Last 3 Months' },
            '180d': { ar: 'نشاط الطلبات - آخر 6 أشهر', en: 'Order Activity - Last 6 Months' },
            '365d': { ar: 'نشاط الطلبات - آخر 12 شهرًا', en: 'Order Activity - Last 12 Months' },
        };
        return language === 'ar' ? ranges[dateRange]?.ar : ranges[dateRange]?.en;
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
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
                                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
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
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    formatter={(value: number) => [`${value}`, language === 'ar' ? 'الطلبات' : 'Orders']}
                                    labelFormatter={(label) => format(new Date(label), 'PPP')}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="orders"
                                    stroke="#8B5CF6"
                                    fillOpacity={1}
                                    fill="url(#colorOrders)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

