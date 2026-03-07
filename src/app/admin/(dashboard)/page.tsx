'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Store, DollarSign, CreditCard, ArrowUpRight, Activity, ShoppingBag, Box, TrendingUp, MapPin } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AdminVisitStats } from '@/components/admin/AdminVisitStats';
import { OnlineUsersPanel } from '@/components/admin/OnlineUsersPanel';
import { StorePerformanceTable } from '@/components/admin/StorePerformanceTable';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [trends, setTrends] = useState<any[]>([]);
    const [topStores, setTopStores] = useState<any[]>([]);
    const [regionalStats, setRegionalStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchAllStats() {
            try {
                const [
                    advancedRes,
                    trendsRes,
                    topStoresRes,
                    regionalRes
                ] = await Promise.all([
                    supabase.rpc('get_admin_dashboard_stats_advanced'),
                    supabase.rpc('get_admin_historical_trends'),
                    supabase.rpc('get_top_performing_stores', { p_limit: 5 }),
                    supabase.rpc('get_sales_by_region')
                ]);

                // Detailed error logging to help the user
                if (advancedRes.error) console.error('[Stats API Error]: get_admin_dashboard_stats_advanced', advancedRes.error);
                if (trendsRes.error) console.error('[Stats API Error]: get_admin_historical_trends', trendsRes.error);
                if (topStoresRes.error) console.error('[Stats API Error]: get_top_performing_stores', topStoresRes.error);
                if (regionalRes.error) console.error('[Stats API Error]: get_sales_by_region', regionalRes.error);

                setStats(advancedRes.data);
                setTrends(trendsRes.data || []);
                setTopStores(topStoresRes.data || []);
                setRegionalStats(regionalRes.data || []);
            } catch (e) {
                console.error('Critical Error fetching dashboard stats:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchAllStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground font-medium">جاري تحليل البيانات...</p>
            </div>
        );
    }

    const hasRegionalData = regionalStats && regionalStats.length > 0;
    const hasTrendData = trends && trends.length > 0;

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-right rtl">لوحة التحكم التنفيذية</h2>
                    <p className="text-muted-foreground mt-1 text-right rtl">نظرة عامة شاملة على أداء المنصة والنمو المالي</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" asChild>
                        <Link href="/admin/recharge-requests">طلبات الشحن ({stats?.pending_recharges || 0})</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/admin/stores">إدارة المتاجر</Link>
                    </Button>
                </div>
            </div>

            {/* KPI Cards Row 1: Platform Overview (Requested to be on top) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي المتاجر</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_stores || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium text-green-600 text-right rtl">
                            {stats?.active_stores || 0} متجر نشط حالياً
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي المنتجات</CardTitle>
                        <Box className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(stats?.total_products || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1 text-right rtl">منتج معروض في كافة المتاجر</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(stats?.total_users || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1 text-right rtl">تجار وشركاء مسجلين</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الزيارات</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(stats?.total_visits || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1 text-right rtl">إجمالي التفاعلات مع المنصة</p>
                    </CardContent>
                </Card>
            </div>

            {/* KPI Cards Row 2: Financial Focus (Requested to be on top) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي المبيعات (GMV)</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(stats?.total_gmv || 0).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">ج.م</span></div>
                        <p className="text-xs text-muted-foreground mt-1 text-green-600 font-medium text-right rtl">
                            <TrendingUp className="h-3 w-3 inline ml-1" />
                            حجم التداول الكلي
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">صافي العمولات</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(stats?.total_commission || 0).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">ج.م</span></div>
                        <p className="text-xs text-muted-foreground mt-1 text-right rtl">صافي أرباح المنصة</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(stats?.total_orders || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1 text-right rtl">
                            معدل التحويل: {stats?.conversion_rate || 0}%
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">متوسط قيمة الطلب (AOV)</CardTitle>
                        <Activity className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(stats?.avg_order_value || 0).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">ج.م</span></div>
                        <p className="text-xs text-muted-foreground mt-1 text-right rtl">لكل عملية شراء</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Analytics Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Revenue & Growth Chart */}
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-right rtl">نمو المبيعات والمنصة</CardTitle>
                        <CardDescription className="text-right rtl">تحليل الأداء المالي ونمو المتاجر خلال آخر 6 أشهر</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {hasTrendData ? (
                            <ResponsiveContainer width="100%" height={380}>
                                <AreaChart data={trends}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}ج`} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value, name) => [name === 'revenue' ? `${value} ج.م` : value, name === 'revenue' ? 'الإيرادات' : (name === 'orders' ? 'الطلبات' : 'المتاجر الجديدة')]}
                                    />
                                    <Area yAxisId="left" type="monotone" dataKey="revenue" name="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                    <Area yAxisId="right" type="monotone" dataKey="orders" name="orders" stroke="#3b82f6" strokeWidth={2} fill="transparent" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[380px] flex items-center justify-center text-muted-foreground">لا توجد بيانات كافية للرسم البياني</div>
                        )}
                    </CardContent>
                </Card>

                {/* Regional Distribution */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <div className="flex items-center justify-end gap-2">
                            <CardTitle className="text-xl font-bold">توزيع المبيعات إقليمياً</CardTitle>
                            <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <CardDescription className="text-right rtl">أكثر المدن والمناطق طلباً عبر المنصة</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-2">
                        {hasRegionalData ? (
                            <>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={regionalStats}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="name"
                                        >
                                            {regionalStats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 w-full px-4 text-right rtl">
                                    {regionalStats.map((entry, index) => (
                                        <div key={entry.name} className="flex items-center gap-2 justify-end">
                                            <span className="text-xs text-muted-foreground">{entry.value} طلب</span>
                                            <span className="text-xs font-medium">{entry.name}</span>
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">لم يتم تسجيل أي طلبات حتى الآن</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                <StorePerformanceTable stores={topStores} />
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-end gap-2">
                            <CardTitle className="text-xl font-bold">النشاط في الوقت الفعلي</CardTitle>
                            <Activity className="h-5 w-5 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <OnlineUsersPanel />
                    </CardContent>
                </Card>
            </div>

            <AdminVisitStats />
        </div>
    );
}
