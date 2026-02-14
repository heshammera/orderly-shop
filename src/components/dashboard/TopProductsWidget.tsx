"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface TopProductsWidgetProps {
    storeId: string;
    currency: string;
}

export function TopProductsWidget({ storeId, currency }: TopProductsWidgetProps) {
    const supabase = createClient();
    const { language } = useLanguage();
    const [topProducts, setTopProducts] = useState<any[]>([]);

    useEffect(() => {
        fetchTopProducts();
    }, [storeId]);

    const fetchTopProducts = async () => {
        try {
            // First get orders for this store with expanded status list (including pending)
            const { data: orders } = await supabase
                .from('orders')
                .select('id')
                .eq('store_id', storeId)
                .in('status', ['delivered', 'processing', 'shipped', 'pending']);

            if (!orders || orders.length === 0) {
                setTopProducts([]);
                return;
            }

            const orderIds = orders.map(o => o.id);

            // Get order items for these orders
            const { data: orderItems } = await supabase
                .from('order_items')
                .select('product_snapshot, quantity, price, order_id')
                .in('order_id', orderIds);

            // Group by product
            const grouped = orderItems?.reduce((acc: any, item) => {
                const productId = item.product_snapshot?.id || 'unknown';
                if (!acc[productId]) {
                    acc[productId] = {
                        product: item.product_snapshot,
                        totalQuantity: 0,
                        totalRevenue: 0,
                    };
                }
                acc[productId].totalQuantity += item.quantity;
                acc[productId].totalRevenue += item.price * item.quantity;
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
                        {topProducts.map((item: any, index) => {
                            const productName = typeof item.product?.name === 'string'
                                ? JSON.parse(item.product.name)
                                : item.product?.name;
                            const displayName = productName?.en || productName?.ar || 'Unknown Product';

                            return (
                                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                        {index + 1}
                                    </div>
                                    {item.product?.images?.[0] && (
                                        <img
                                            src={item.product.images[0]}
                                            alt={displayName}
                                            className="w-12 h-12 object-cover rounded"
                                        />
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
