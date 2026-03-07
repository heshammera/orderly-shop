"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Store, Eye, Monitor, RefreshCcw, Settings } from 'lucide-react';

interface OnlineUser {
    id: string;
    visitor_id: string;
    user_id: string | null;
    user_type: 'admin' | 'store_owner' | 'visitor';
    current_page: string;
    store_name: string | null;
    last_seen: string;
}

interface OnlineUsersData {
    total: number;
    admins: number;
    storeOwners: number;
    visitors: number;
    users: OnlineUser[];
}

type FilterType = 'all' | 'admin' | 'store_owner' | 'visitor';

function getPageLabel(path: string, storeName?: string | null): string {
    if (path === '/') return storeName ? 'الرئيسية للمتجر' : 'الرئيسية للمنصة';
    if (path.startsWith('/s/') && path.includes('/p/')) return 'صفحة منتج';
    if (path.startsWith('/s/')) {
        const parts = path.split('/').filter(Boolean);
        // /s/slug
        if (parts.length === 2 && parts[0] === 's') return 'الرئيسية للمتجر';
        return 'صفحة داخل المتجر';
    }
    if (path.startsWith('/dashboard')) return 'لوحة تحكم التاجر';
    if (path.startsWith('/admin')) return 'لوحة الأدمن';
    if (path.startsWith('/auth') || path.includes('/login') || path.includes('/signup')) return 'تسجيل / دخول';
    if (path.startsWith('/select-plan')) return 'اختيار خطة';
    if (path.startsWith('/tutorials')) return 'الدروس التعليمية';
    if (path === 'offline') return 'غادر الموقع';
    return path;
}

function getTimeSince(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 10) return 'الآن';
    if (seconds < 60) return `منذ ${seconds} ثانية`;
    const minutes = Math.floor(seconds / 60);
    return `منذ ${minutes} دقيقة`;
}

export function OnlineUsersPanel() {
    const [data, setData] = useState<OnlineUsersData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');

    const fetchOnlineUsers = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/online-users');
            if (!res.ok) throw new Error('Failed to fetch');
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching online users:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOnlineUsers();
        // Auto-refresh every 10 seconds
        const interval = setInterval(fetchOnlineUsers, 10000);
        return () => clearInterval(interval);
    }, [fetchOnlineUsers]);

    const filteredUsers = data?.users?.filter(u => {
        if (filter === 'all') return true;
        return u.user_type === filter;
    }) || [];

    if (loading) {
        return (
            <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-muted rounded w-1/3" />
                        <div className="h-32 bg-muted rounded" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <div className="relative">
                                <Monitor className="h-5 w-5" />
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                            </div>
                            المتواجدون حالياً
                        </CardTitle>
                        <span className="text-2xl font-bold text-green-600">{data?.total || 0}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchOnlineUsers}
                        className="text-muted-foreground"
                    >
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                        <Badge className="h-3.5 w-3.5 p-0 bg-red-500 rounded-full" />
                        {data?.admins || 0} أدمن
                    </span>
                    <span className="flex items-center gap-1">
                        <Store className="h-3.5 w-3.5 text-blue-500" />
                        {data?.storeOwners || 0} صاحب متجر
                    </span>
                    <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-gray-500" />
                        {data?.visitors || 0} زائر
                    </span>
                </div>
            </CardHeader>
            <CardContent className="pb-4">
                {/* Filter Buttons */}
                <div className="flex gap-2 mb-4">
                    {(['all', 'admin', 'store_owner', 'visitor'] as FilterType[]).map((f) => (
                        <Button
                            key={f}
                            variant={filter === f ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter(f)}
                            className="text-xs"
                        >
                            {f === 'all' ? 'الكل' : f === 'admin' ? 'أدمن' : f === 'store_owner' ? 'أصحاب متاجر' : 'زوار'}
                            <span className="ms-1 text-xs opacity-70">
                                ({f === 'all' ? data?.total : f === 'admin' ? data?.admins : f === 'store_owner' ? data?.storeOwners : data?.visitors || 0})
                            </span>
                        </Button>
                    ))}
                </div>

                {/* Users Table */}
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">لا يوجد متواجدون حالياً</p>
                    </div>
                ) : (
                    <div className="rounded-lg border overflow-hidden">
                        <div className="max-h-[400px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 sticky top-0">
                                    <tr>
                                        <th className="text-right p-3 font-medium text-muted-foreground">النوع</th>
                                        <th className="text-right p-3 font-medium text-muted-foreground">الصفحة الحالية</th>
                                        <th className="text-right p-3 font-medium text-muted-foreground">المتجر</th>
                                        <th className="text-right p-3 font-medium text-muted-foreground">آخر نشاط</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-3">
                                                {user.user_type === 'admin' ? (
                                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0 text-xs">
                                                        <Settings className="h-3 w-3 me-1" />
                                                        أدمن
                                                    </Badge>
                                                ) : user.user_type === 'store_owner' ? (
                                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 text-xs">
                                                        <Store className="h-3 w-3 me-1" />
                                                        صاحب متجر
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-xs">
                                                        <Eye className="h-3 w-3 me-1" />
                                                        زائر
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {getPageLabel(user.current_page)}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {user.store_name || '—'}
                                            </td>
                                            <td className="p-3">
                                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                                                    {getTimeSince(user.last_seen)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
