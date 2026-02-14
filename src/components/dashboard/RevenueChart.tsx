"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface RevenueChartProps {
    storeId: string;
}

export function RevenueChart({ storeId }: RevenueChartProps) {
    const supabase = createClient();
    const { language } = useLanguage();
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        fetchRevenueData();
    }, [storeId]);

    const fetchRevenueData = async () => {
        try {
            // Get last 30 days of orders
            const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

            const { data: orders } = await supabase
                .from('orders')
                .select('created_at, total')
                .eq('store_id', storeId)
                .gte('created_at', thirtyDaysAgo)
                .in('status', ['delivered', 'processing', 'shipped']);

            // Group by day
            const grouped = orders?.reduce((acc: any, order) => {
                const day = format(new Date(order.created_at), 'yyyy-MM-dd');
                if (!acc[day]) {
                    acc[day] = { date: day, revenue: 0, count: 0 };
                }
                acc[day].revenue += order.total;
                acc[day].count += 1;
                return acc;
            }, {});

            const chartArray = Object.values(grouped || {}).sort((a: any, b: any) =>
                a.date.localeCompare(b.date)
            );

            setChartData(chartArray);
        } catch (error) {
            console.error('Error fetching revenue data:', error);
        }
    };

    const maxRevenue = Math.max(...chartData.map((d: any) => d.revenue), 1);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    {language === 'ar' ? 'الإيرادات - آخر 30 يوم' : 'Revenue - Last 30 Days'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {chartData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                        {language === 'ar' ? 'لا توجد بيانات' : 'No data available'}
                    </p>
                ) : (
                    <div className="space-y-2">
                        {chartData.map((item: any) => (
                            <div key={item.date} className="flex items-center gap-4">
                                <div className="w-24 text-sm text-muted-foreground">
                                    {format(new Date(item.date), 'MMM dd')}
                                </div>
                                <div className="flex-1">
                                    <div className="h-8 bg-primary/20 relative rounded overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all"
                                            style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="w-32 text-sm font-medium text-right">
                                    {item.revenue.toFixed(2)} SAR
                                    <span className="text-xs text-muted-foreground ml-2">
                                        ({item.count} {language === 'ar' ? 'طلب' : 'orders'})
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
