'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface TopStore {
    id: string;
    name: any;
    slug: string;
    status: string;
    orders_count: number;
    total_sales: number;
    commission_generated: number;
}

export function StorePerformanceTable({ stores }: { stores: TopStore[] }) {
    if (!stores || stores.length === 0) return null;

    const getStoreName = (name: any) => {
        const nameObj = typeof name === 'string' ? JSON.parse(name) : name;
        return nameObj?.ar || nameObj?.en || 'Unnamed Store';
    };

    return (
        <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-bold">أفضل المتاجر أداءً</CardTitle>
                </div>
                <TrendingUp className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-right rtl">
                        <thead className="border-b bg-muted/50">
                            <tr className="transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">المتجر</th>
                                <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">الطلبات</th>
                                <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">المبيعات</th>
                                <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">العمولة</th>
                                <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {stores.map((store) => (
                                <tr key={store.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-2 align-middle font-medium">
                                        <div className="flex flex-col">
                                            <Link href={`/admin/stores/${store.id}`} className="hover:underline text-primary">
                                                {getStoreName(store.name)}
                                            </Link>
                                            <span className="text-xs text-muted-foreground">@{store.slug}</span>
                                        </div>
                                    </td>
                                    <td className="p-2 align-middle">{store.orders_count}</td>
                                    <td className="p-2 align-middle font-bold text-green-600">
                                        {store.total_sales.toLocaleString()} ج.م
                                    </td>
                                    <td className="p-2 align-middle">
                                        {store.commission_generated.toLocaleString()} ج.م
                                    </td>
                                    <td className="p-2 align-middle">
                                        <Badge variant={store.status === 'active' ? 'outline' : 'destructive'} className={store.status === 'active' ? 'bg-green-50 text-green-700' : ''}>
                                            {store.status === 'active' ? 'نشط' : 'محظور'}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
