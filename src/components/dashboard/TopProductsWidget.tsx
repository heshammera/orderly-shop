"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { subDays } from 'date-fns';

interface TopProductsWidgetProps {
    storeId: string;
    currency: string;
    dateRange?: string;
}

export function TopProductsWidget({ storeId, currency, dateRange = '30d' }: TopProductsWidgetProps) {
    const supabase = createClient();
    const { language } = useLanguage();
    const [topProducts, setTopProducts] = useState<any[]>([]);

    useEffect(() => {
        fetchTopProducts();
    }, [storeId, dateRange]);

    const fetchTopProducts = async () => {
        try {
            let days = 30;
            if (dateRange === '7d') days = 7;
            if (dateRange === '90d') days = 90;
            if (dateRange === '180d') days = 180;
            if (dateRange === '365d') days = 365;

            const startDate = subDays(new Date(), days).toISOString();

            // First get orders for this store with expanded status list (including pending)
            const { data: orders } = await supabase
                .from('orders')
                .select('id')
                .eq('store_id', storeId)
                .gte('created_at', startDate)
                .in('status', ['delivered', 'processing', 'shipped', 'pending']);

            if (!orders || orders.length === 0) {
                setTopProducts([]);
                return;
            }

            const orderIds = orders.map(o => o.id);

            // Get order items for these orders joining live product data
            const { data: orderItems } = await supabase
                .from('order_items')
                .select(`
                    quantity, 
                    total_price, 
                    product_id,
                    product_snapshot,
                    product:products(name, images)
                `)
                .in('order_id', orderIds);

            // Group by product
            const grouped = orderItems?.reduce((acc: any, item: any) => {
                const productId = item.product_id || 'custom-bump-offer';
                if (!acc[productId]) {
                    acc[productId] = {
                        productId,
                        product: item.product,
                        snapshotName: item.product_snapshot?.name,
                        totalQuantity: 0,
                        totalRevenue: 0,
                    };
                }
                acc[productId].totalQuantity += item.quantity;
                acc[productId].totalRevenue += item.total_price || 0;
                return acc;
            }, {});

            const topArray = Object.values(grouped || {})
                .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
                .slice(0, 5);

            setTopProducts(topArray);
        } catch (error) {
            console.error('Error fetching top products:', error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    {language === 'ar' ? 'أكثر المنتجات مبيعاً' : 'Top Selling Products'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {topProducts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                        {language === 'ar' ? 'لا توجد بيانات' : 'No data available'}
                    </p>
                ) : (
                    <div className="space-y-4">
                        {topProducts.map((item: any, index: number) => {
                            let displayName = item.snapshotName || 'Unknown Product';

                            // Try to parse JSON names from live product table
                            if (item.product?.name) {
                                try {
                                    const parsed = typeof item.product.name === 'string' && item.product.name.startsWith('{')
                                        ? JSON.parse(item.product.name)
                                        : item.product.name;
                                    displayName = parsed?.ar || parsed?.en || (typeof parsed === 'string' ? parsed : displayName);
                                } catch (e) { displayName = item.product.name; }
                            } else if (item.snapshotName) {
                                if (typeof item.snapshotName === 'object') {
                                    displayName = item.snapshotName?.ar || item.snapshotName?.en || displayName;
                                } else if (typeof item.snapshotName === 'string' && item.snapshotName.startsWith('{')) {
                                    try {
                                        const parsed = JSON.parse(item.snapshotName);
                                        displayName = parsed?.ar || parsed?.en || displayName;
                                    } catch (e) { }
                                }
                            }

                            // Parse images - stored as stringified JSON in DB
                            let imageUrl = null;
                            if (item.product?.images) {
                                try {
                                    const imgs = typeof item.product.images === 'string'
                                        ? JSON.parse(item.product.images)
                                        : item.product.images;
                                    if (Array.isArray(imgs) && imgs.length > 0) {
                                        imageUrl = imgs[0];
                                    }
                                } catch (e) { }
                            }

                            return (
                                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                        {index + 1}
                                    </div>
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={displayName}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-muted-foreground">
                                            -
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="font-medium">{displayName}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {item.totalQuantity} {language === 'ar' ? 'وحدة مباعة' : 'units sold'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{item.totalRevenue.toFixed(2)} {currency}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
