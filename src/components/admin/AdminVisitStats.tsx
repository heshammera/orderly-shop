"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VisitStats {
    daily: number;
    weekly: number;
    monthly: number;
    chartData: { date: string; label: string; visits: number }[];
}

export function AdminVisitStats() {
    const [stats, setStats] = useState<VisitStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/visits');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching visit stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        // Refresh every 60 seconds
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const cards = [
        {
            title: 'زيارات اليوم',
            value: stats?.daily || 0,
            icon: Calendar,
            color: 'text-blue-600',
            bg: 'bg-blue-100',
            gradient: 'from-blue-500 to-blue-600',
        },
        {
            title: 'زيارات الأسبوع',
            value: stats?.weekly || 0,
            icon: CalendarDays,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100',
            gradient: 'from-emerald-500 to-emerald-600',
        },
        {
            title: 'زيارات الشهر',
            value: stats?.monthly || 0,
            icon: CalendarRange,
            color: 'text-violet-600',
            bg: 'bg-violet-100',
            gradient: 'from-violet-500 to-violet-600',
        },
    ];

    if (loading) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    إحصائيات الزيارات
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-16 bg-muted rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="h-5 w-5" />
                إحصائيات زيارات المنصة
            </h3>

            {/* Visit Count Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {cards.map((card, idx) => (
                    <Card key={idx} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                        <div className={`h-1 bg-gradient-to-r ${card.gradient}`} />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {card.title}
                            </CardTitle>
                            <div className={`p-2.5 rounded-xl ${card.bg}`}>
                                <card.icon className={`h-5 w-5 ${card.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight" dir="ltr">
                                {card.value.toLocaleString('ar-EG')}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">زيارة</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Visits Chart */}
            {stats?.chartData && stats.chartData.length > 0 && (
                <Card className="border-0 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-base">الزيارات اليومية - آخر 30 يوم</CardTitle>
                        <CardDescription>نظرة عامة على حركة الزيارات في المنصة</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={stats.chartData}>
                                <defs>
                                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="label"
                                    stroke="#888888"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    formatter={(value: number) => [value.toLocaleString('ar-EG'), 'زيارة']}
                                    labelStyle={{ color: 'black', fontWeight: 'bold' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="visits"
                                    stroke="#6366f1"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#colorVisits)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
