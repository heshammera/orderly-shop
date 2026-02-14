import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Users, ShoppingBag, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminDashboard() {
    const { language } = useLanguage();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const [
                { count: storesCount },
                { count: activeStoresCount },
                { count: usersCount }
            ] = await Promise.all([
                supabase.from('stores').select('*', { count: 'exact', head: true }),
                supabase.from('stores').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('profiles').select('*', { count: 'exact', head: true })
            ]);

            return {
                stores: storesCount || 0,
                activeStores: activeStoresCount || 0,
                users: usersCount || 0
            };
        }
    });

    const cards = [
        {
            title: { ar: 'إجمالي المتاجر', en: 'Total Stores' },
            value: stats?.stores || 0,
            icon: Store,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            title: { ar: 'المتاجر النشطة', en: 'Active Stores' },
            value: stats?.activeStores || 0,
            icon: TrendingUp,
            color: 'text-green-600',
            bg: 'bg-green-100'
        },
        {
            title: { ar: 'المستخدمين', en: 'Users' },
            value: stats?.users || 0,
            icon: Users,
            color: 'text-purple-600',
            bg: 'bg-purple-100'
        }
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {language === 'ar'
                        ? 'نظرة عامة على أداء المنصة والمتاجر المسجلة.'
                        : 'Overview of platform performance and registered stores.'}
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {card.title[language as 'ar' | 'en']}
                                </CardTitle>
                                <div className={`p-2 rounded-full ${card.bg}`}>
                                    <Icon className={`h-4 w-4 ${card.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{isLoading ? '-' : card.value}</div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
