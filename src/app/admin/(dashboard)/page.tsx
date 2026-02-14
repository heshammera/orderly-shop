'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Store, DollarSign, CreditCard, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    // Mock data for charts (since we don't have historical data tables yet)
    const revenueData = [
        { name: 'Jan', total: 1200 },
        { name: 'Feb', total: 2100 },
        { name: 'Mar', total: 1800 },
        { name: 'Apr', total: 2400 },
        { name: 'May', total: 3200 },
        { name: 'Jun', total: 4500 },
    ];

    const storesData = [
        { name: 'Jan', active: 10, banned: 0 },
        { name: 'Feb', active: 15, banned: 1 },
        { name: 'Mar', active: 22, banned: 1 },
        { name: 'Apr', active: 28, banned: 2 },
        { name: 'May', active: 35, banned: 2 },
        { name: 'Jun', active: 42, banned: 3 },
    ];

    useEffect(() => {
        async function fetchStats() {
            try {
                const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
                if (error) throw error;
                setStats(data);
            } catch (e) {
                console.error('Error fetching stats:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">جاري تحميل الإحصائيات...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">نظرة عامة</h2>
                <div className="flex items-center gap-2">
                    <Button asChild>
                        <Link href="/admin/stores">إدارة المتاجر</Link>
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي المتاجر</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_stores || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.active_stores || 0} متجر نشط
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">الإيرادات</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_revenue?.toLocaleString()} ج.م</div>
                        <p className="text-xs text-muted-foreground flex items-center">
                            <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                            +20.1% من الشهر الماضي
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">المشتركين</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            مستخدم مسجل
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">طلبات الشحن</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.pending_recharges || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            طلب معلق
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>نمو الإيرادات</CardTitle>
                        <CardDescription>
                            نظرة عامة على الإيرادات الشهرية لعام 2026
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}ج`} />
                                <Tooltip formatter={(value) => [`${value} ج.م`, 'الإيرادات']} labelStyle={{ color: 'black' }} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <Area type="monotone" dataKey="total" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>نمو المتاجر</CardTitle>
                        <CardDescription>
                            المتاجر النشطة مقابل المحظورة
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={storesData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} labelStyle={{ color: 'black' }} />
                                <Bar dataKey="active" name="نشط" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="banned" name="محظور" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
