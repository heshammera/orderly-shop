import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { Loader2, DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, parseISO, isWithinInterval } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export default function StoreAnalytics() {
    const { storeId } = useParams<{ storeId: string }>();
    const { language } = useLanguage();
    const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, all

    // Fetch store info
    const { data: store } = useQuery({
        queryKey: ['store', storeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('stores')
                .select('name, currency')
                .eq('id', storeId!)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!storeId,
    });

    // Fetch all orders
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['analytics-orders', storeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('id, total, created_at, status, customer:customer_id(name)')
                .eq('store_id', storeId!)
                .neq('status', 'cancelled'); // Exclude cancelled orders

            if (error) throw error;
            return data;
        },
        enabled: !!storeId,
    });

    // Fetch order items for top products
    const { data: orderItems = [] } = useQuery({
        queryKey: ['analytics-order-items', storeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('order_items')
                .select('product_id, quantity, products(name)')
                .eq('orders.store_id', storeId!); // This assumes a join or robust RLS, checking simplicity

            // Simpler approach: fetch all items for store's orders
            // But order_items doesn't strictly have store_id usually, it links to order.
            // Let's fetch order_items where order_id in (our orders)
            // For now, let's do client side aggregation if possible, or a join.
            // Supabase Join: order_items inner join orders

            const { data: items, error: itemsError } = await supabase
                .from('order_items')
                .select(`
          quantity,
          products (name),
          orders!inner (store_id, status)
        `)
                .eq('orders.store_id', storeId!)
                .neq('orders.status', 'cancelled');

            if (itemsError) throw itemsError;
            return items;
        },
        enabled: !!storeId,
    });


    // Process Data based on Time Range
    const analyticsData = useMemo(() => {
        const now = new Date();
        let startDate = subDays(now, 7);

        if (timeRange === '30d') startDate = subDays(now, 30);
        if (timeRange === '90d') startDate = subDays(now, 90);
        if (timeRange === 'all') startDate = new Date(0); // Beginning of time

        const filteredOrders = orders.filter(order =>
            isWithinInterval(parseISO(order.created_at), { start: startDate, end: now })
        );

        // Metrics
        const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.total), 0);
        const totalOrders = filteredOrders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Chart Data (Group by Day)
        const dailyData = new Map();

        // Initialize days
        if (timeRange !== 'all') { // For 'all', we just show data points
            let current = startDate;
            while (current <= now) {
                const dateStr = format(current, 'yyyy-MM-dd');
                dailyData.set(dateStr, { date: dateStr, revenue: 0, orders: 0 });
                current = new Date(current.setDate(current.getDate() + 1));
            }
        }

        filteredOrders.forEach(order => {
            const dateStr = format(parseISO(order.created_at), 'yyyy-MM-dd');
            if (!dailyData.has(dateStr)) {
                dailyData.set(dateStr, { date: dateStr, revenue: 0, orders: 0 });
            }
            const day = dailyData.get(dateStr);
            day.revenue += Number(order.total);
            day.orders += 1;
        });

        const chartData = Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date));

        return {
            totalRevenue,
            totalOrders,
            averageOrderValue,
            chartData
        };
    }, [orders, timeRange]);

    // Top Products Logic
    const topProducts = useMemo(() => {
        const productMap = new Map();
        orderItems.forEach((item: any) => {
            const productName = item.products?.name;
            // Handle JSONB name if needed, assuming simple string or object
            let name = 'Unknown';
            if (typeof productName === 'string') {
                try {
                    const parsed = JSON.parse(productName);
                    name = parsed[language] || parsed.ar || parsed.en || productName;
                } catch {
                    name = productName;
                }
            } else if (typeof productName === 'object') {
                name = productName[language] || productName.ar || productName.en;
            }

            const qty = item.quantity;
            if (!productMap.has(name)) {
                productMap.set(name, 0);
            }
            productMap.set(name, productMap.get(name) + qty);
        });

        return Array.from(productMap.entries())
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }, [orderItems, language]);


    const storeName = store?.name
        ? (typeof store.name === 'string' ? JSON.parse(store.name) : store.name)[language] || (typeof store.name === 'string' ? JSON.parse(store.name) : store.name).ar
        : '';

    const currency = store?.currency || 'USD';

    if (isLoading) {
        return (
            <DashboardLayout storeId={storeId!} storeName={storeName}>
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout storeId={storeId!} storeName={storeName}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {language === 'ar' ? 'التحليلات' : 'Analytics'}
                        </h1>
                        <p className="text-muted-foreground">
                            {language === 'ar' ? 'متابعة أداء متجرك ومبيعاتك' : 'Track your store performance and sales'}
                        </p>
                    </div>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">{language === 'ar' ? 'آخر 7 أيام' : 'Last 7 days'}</SelectItem>
                            <SelectItem value="30d">{language === 'ar' ? 'آخر 30 يوم' : 'Last 30 days'}</SelectItem>
                            <SelectItem value="90d">{language === 'ar' ? 'آخر 3 شهور' : 'Last 3 months'}</SelectItem>
                            <SelectItem value="all">{language === 'ar' ? 'كل الوقت' : 'All time'}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {language === 'ar' ? 'إجمالي المبيعات' : 'Total Revenue'}
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: currency }).format(analyticsData.totalRevenue)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {language === 'ar' ? 'في الفترة المحددة' : 'In selected period'}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {language === 'ar' ? 'عدد الطلبات' : 'Total Orders'}
                            </CardTitle>
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analyticsData.totalOrders}</div>
                            <p className="text-xs text-muted-foreground">
                                {language === 'ar' ? 'طلب مكتمل' : 'Completed orders'}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {language === 'ar' ? 'متوسط قيمة الطلب' : 'Average Order Value'}
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: currency }).format(analyticsData.averageOrderValue)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {language === 'ar' ? 'لكل طلب' : 'Per order'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Revenue Chart */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>{language === 'ar' ? 'المبيعات عبر الزمن' : 'Revenue Over Time'}</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analyticsData.chartData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(str) => {
                                                const date = parseISO(str);
                                                return format(date, 'MMM d', { locale: language === 'ar' ? ar : enUS });
                                            }}
                                            style={{ fontSize: 12 }}
                                        />
                                        <YAxis
                                            tickFormatter={(value) =>
                                                new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(value)
                                            }
                                            style={{ fontSize: 12 }}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => [
                                                new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: currency }).format(value),
                                                language === 'ar' ? 'المبيعات' : 'Revenue'
                                            ]}
                                            labelFormatter={(label) => format(parseISO(label), 'PPP', { locale: language === 'ar' ? ar : enUS })}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Products */}
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>{language === 'ar' ? 'أكثر المنتجات مبيعاً' : 'Top Selling Products'}</CardTitle>
                            <CardDescription>
                                {language === 'ar' ? 'أعلى 5 منتجات حسب الكمية' : 'Top 5 products by quantity sold'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                {topProducts.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={topProducts} margin={{ top: 0, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={100} style={{ fontSize: 12 }} />
                                            <Tooltip />
                                            <Bar dataKey="quantity" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        {language === 'ar' ? 'لا توجد بيانات كافية' : 'No data available'}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
