"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingBag, Users, DollarSign } from 'lucide-react';

interface AnalyticsStatsProps {
    storeId: string;
}

export function AnalyticsStats({ storeId }: AnalyticsStatsProps) {
    const supabase = createClient();
    const { language } = useLanguage();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        avgOrderValue: 0,
    });

    useEffect(() => {
        fetchStats();
    }, [storeId]);

    const fetchStats = async () => {
        try {
            // Get orders
            const { data: orders } = await supabase
                .from('orders')
                .select('total, status')
                .eq('store_id', storeId)
                .in('status', ['delivered', 'processing', 'shipped']);

            const totalRevenue = orders?.reduce((sum, o) => sum + o.total, 0) || 0;
            const totalOrders = orders?.length || 0;

            // Get customers
            const { count: customerCount } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true })
                .eq('store_id', storeId);

            setStats({
                totalRevenue,
                totalOrders,
                totalCustomers: customerCount || 0,
                avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    return (
        <div className="grid gap-4 md:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                        {language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} SAR</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                        {language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}
                    </CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalOrders}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                        {language === 'ar' ? 'إجمالي العملاء' : 'Total Customers'}
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                        {language === 'ar' ? 'متوسط قيمة الطلب' : 'Avg Order Value'}
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.avgOrderValue.toFixed(2)} SAR</div>
                </CardContent>
            </Card>
        </div>
    );
}
