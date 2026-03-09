"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChartIcon, Loader2 } from 'lucide-react';
import { subDays } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SalesByCategoryChartProps {
    storeId: string;
    dateRange?: string;
    currency: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

export function SalesByCategoryChart({ storeId, dateRange = '30d', currency }: SalesByCategoryChartProps) {
    const supabase = createClient();
    const { language } = useLanguage();
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCategoryData();
    }, [storeId, dateRange]);

    const fetchCategoryData = async () => {
        setIsLoading(true);
        try {
            let days = 30;
            if (dateRange === '7d') days = 7;
            if (dateRange === '90d') days = 90;
            if (dateRange === '180d') days = 180;
            if (dateRange === '365d') days = 365;

            const startDate = subDays(new Date(), days).toISOString();

            // 1. Get orders in period
            const { data: orders } = await supabase
                .from('orders')
                .select('id')
                .eq('store_id', storeId)
                .gte('created_at', startDate)
                .in('status', ['pending', 'completed', 'delivered', 'processing', 'shipped']);

            const orderIds = orders?.map(o => o.id) || [];

            if (orderIds.length === 0) {
                setChartData([]);
                return;
            }

            // 2. Get order items
            const { data: orderItems } = await supabase
                .from('order_items')
                .select('product_id, total_price')
                .in('order_id', orderIds);

            if (!orderItems || orderItems.length === 0) {
                setChartData([]);
                return;
            }

            // 3. Get all store categories
            const { data: categories } = await supabase
                .from('categories')
                .select('id, name')
                .eq('store_id', storeId)
                .eq('status', 'active');

            // 4. Get product category mappings
            const productIds = Array.from(new Set(orderItems.map(i => i.product_id).filter(id => id != null)));
            const { data: prodCats } = await supabase
                .from('product_categories')
                .select('product_id, category_id')
                .in('product_id', productIds);

            // 5. Aggregate revenue per category
            const categoryRevenue: Record<string, { name: string, value: number }> = {};

            // Uncategorized bucket
            categoryRevenue['uncategorized'] = {
                name: language === 'ar' ? 'غير مصنف' : 'Uncategorized',
                value: 0
            };

            orderItems.forEach(item => {
                if (!item.product_id) return;

                const mapping = prodCats?.find(pc => pc.product_id === item.product_id);
                if (mapping) {
                    const category = categories?.find(c => c.id === mapping.category_id);
                    if (category) {
                        let catName = 'Unknown';
                        if (category.name) {
                            let parsed = category.name;
                            if (typeof category.name === 'string' && category.name.startsWith('{')) {
                                try { parsed = JSON.parse(category.name); } catch (e) { }
                            }
                            catName = parsed?.[language] || parsed?.['en'] || (typeof parsed === 'string' ? parsed : 'Unknown');
                        }

                        if (!categoryRevenue[category.id]) {
                            categoryRevenue[category.id] = { name: catName, value: 0 };
                        }
                        categoryRevenue[category.id].value += item.total_price;
                    } else {
                        categoryRevenue['uncategorized'].value += item.total_price;
                    }
                } else {
                    categoryRevenue['uncategorized'].value += item.total_price;
                }
            });

            // Clean up and format
            let result = Object.values(categoryRevenue).filter(c => c.value > 0);
            result.sort((a, b) => b.value - a.value); // sort descending

            setChartData(result);
        } catch (error) {
            console.error('Error fetching category sales:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getTitle = () => {
        const ranges: Record<string, { ar: string, en: string }> = {
            '7d': { ar: 'المبيعات حسب الفئة - آخر 7 أيام', en: 'Sales by Category - Last 7 Days' },
            '30d': { ar: 'المبيعات حسب الفئة - آخر 30 يوم', en: 'Sales by Category - Last 30 Days' },
            '90d': { ar: 'المبيعات حسب الفئة - آخر 3 أشهر', en: 'Sales by Category - Last 3 Months' },
            '180d': { ar: 'المبيعات حسب الفئة - آخر 6 أشهر', en: 'Sales by Category - Last 6 Months' },
            '365d': { ar: 'المبيعات حسب الفئة - آخر 12 شهرًا', en: 'Sales by Category - Last 12 Months' },
        };
        return language === 'ar' ? ranges[dateRange]?.ar : ranges[dateRange]?.en;
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5" />
                    {getTitle()}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : chartData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-16">
                        {language === 'ar' ? 'لا توجد بيانات كافية' : 'Not enough data'}
                    </p>
                ) : (
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => [`${value.toFixed(2)} ${currency}`, language === 'ar' ? 'المبيعات' : 'Sales']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
