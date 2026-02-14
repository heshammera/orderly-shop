"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdvancedAnalyticsStats } from '@/components/dashboard/AdvancedAnalyticsStats';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { GettingStarted } from '@/components/dashboard/GettingStarted';
import { TopProductsWidget } from '@/components/dashboard/TopProductsWidget';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSearchParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage({ params }: { params: { storeId: string } }) {
    const { storeId } = params;
    const { language } = useLanguage();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({
        store: null,
        productsCount: 0,
        ordersCount: 0,
        categoriesCount: 0,
        recentOrders: [],
        revenueData: [],
        topProductsData: [] // For charts
    });

    useEffect(() => {
        if (searchParams.get('verified') === 'true') {
            toast({
                title: language === 'ar' ? 'تم تفعيل الحساب بنجاح' : 'Account Activated Successfully',
                description: language === 'ar' ? 'تم إنشاء متجرك وتفعيله بنجاح.' : 'Your store has been created and activated successfully.',
                className: 'bg-green-50 border-green-200 text-green-800'
            });
            // Clean up URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [searchParams, toast, language]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Parallel fetch similar to server version
                const [
                    { data: store },
                    { count: productsCount },
                    { count: ordersCount },
                    { count: categoriesCount },
                    { data: recentOrders },
                    { data: analyticsOrders },
                    { data: topSelling }
                ] = await Promise.all([
                    supabase.from('stores').select('*').eq('id', storeId).single(),
                    supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', storeId),
                    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', storeId),
                    supabase.from('categories').select('*', { count: 'exact', head: true }).eq('store_id', storeId),
                    supabase.from('orders').select('id, order_number, status, total, currency, customer_snapshot, created_at').eq('store_id', storeId).order('created_at', { ascending: false }).limit(5),
                    supabase.from('orders').select('created_at, total').eq('store_id', storeId).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).order('created_at', { ascending: true }),
                    supabase.from('order_items').select('quantity, products(name), orders!inner(store_id)').eq('orders.store_id', storeId)
                ]);

                // Process Revenue Data
                const revenueMap = new Map<string, number>();
                analyticsOrders?.forEach(order => {
                    const date = new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                    revenueMap.set(date, (revenueMap.get(date) || 0) + (order.total || 0));
                });
                const revenueData = Array.from(revenueMap.entries()).map(([name, total]) => ({ name, total }));

                // Process Top Products Data for Chart
                const productMap = new Map<string, number>();
                topSelling?.forEach((item: any) => {
                    let productName = 'Unknown';
                    if (item.products?.name) {
                        const nameData = item.products.name;
                        if (typeof nameData === 'string') {
                            try {
                                const parsed = JSON.parse(nameData);
                                productName = parsed.en || parsed.ar || nameData;
                            } catch { productName = nameData; }
                        } else {
                            productName = nameData.en || nameData.ar || 'Unknown';
                        }
                    }
                    productMap.set(productName, (productMap.get(productName) || 0) + item.quantity);
                });
                const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"];
                const topProductsData = Array.from(productMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name, value], index) => ({
                        name,
                        value,
                        color: colors[index % colors.length]
                    }));

                setData({
                    store,
                    productsCount: productsCount || 0,
                    ordersCount: ordersCount || 0,
                    categoriesCount: categoriesCount || 0,
                    recentOrders: recentOrders || [],
                    revenueData,
                    topProductsData
                });
            } catch (error) {
                console.error("Error loading dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [storeId]);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    const { store } = data;
    if (!store) return null; // Or not found

    const isLocked = !store.has_unlimited_balance && (store.balance <= 0);

    return (
        <div className="space-y-6">
            {isLocked && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <Lock className="h-4 w-4" />
                    <AlertTitle>{language === 'ar' ? 'تم تقييد الوصول للبيانات' : 'Data Access Restricted (Low Balance)'}</AlertTitle>
                    <AlertDescription className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
                        <p>{language === 'ar' ? 'رصيد محفظتك فارغ. تم إخفاء بيانات العملاء. يرجى شحن الرصيد لاستعادة الوصول الكامل.' : 'Your wallet balance is empty. Customer data is masked. Please recharge to restore full access.'}</p>
                        <Button variant="destructive" size="sm" asChild>
                            <Link href={`/dashboard/${storeId}/wallet`}>
                                {language === 'ar' ? 'شحن الرصيد' : 'Recharge Now'}
                            </Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <div>
                <h1 className="text-2xl font-bold">{language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</h1>
                <p className="text-muted-foreground">{language === 'ar' ? 'نظرة عامة على أداء متجرك' : 'Overview of your store performance'}</p>
            </div>

            <div className="space-y-6">
                <AdvancedAnalyticsStats storeId={storeId} currency={store.currency} />
                <AnalyticsCharts
                    revenueData={data.revenueData}
                    topProductsData={data.topProductsData}
                    currency={store.currency}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RecentOrders
                        orders={data.recentOrders}
                        storeId={storeId}
                    />
                </div>
                <div>
                    <TopProductsWidget storeId={storeId} currency={store.currency} />
                    <GettingStarted
                        storeId={storeId}
                        hasProducts={data.productsCount > 0}
                        hasCategories={data.categoriesCount > 0}
                        storeConfigured={!!store.logo_url}
                    />
                </div>
            </div>
        </div>
    );
}
