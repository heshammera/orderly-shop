"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function BillingPage({ params }: { params: { storeId: string } }) {
    const { storeId } = params;
    const { language } = useLanguage();

    const { subscription, limits, usage, isLoading, planName } = useSubscription(storeId);

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    const productsUsed = usage?.['products_count'] || 0;
    const productsLimit = limits.products;
    const productsPercentage = productsLimit === -1 ? 0 : Math.min((productsUsed / productsLimit) * 100, 100);

    const ordersUsed = usage?.['orders_count_monthly'] || 0;
    const ordersLimit = limits.orders_monthly;
    const ordersPercentage = ordersLimit === -1 ? 0 : Math.min((ordersUsed / ordersLimit) * 100, 100);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">
                    {language === 'ar' ? 'الاشتراك والباقات' : 'Billing & Subscription'}
                </h1>
                <p className="text-muted-foreground">
                    {language === 'ar' ? 'إدارة باقتك وحدود الاستخدام' : 'Manage your plan and usage limits'}
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Current Plan Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>{language === 'ar' ? 'الباقة الحالية' : 'Current Plan'}</CardTitle>
                        <CardDescription>{language === 'ar' ? 'تفاصيل اشتراكك الحالي' : 'Your subscription details'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">{language === 'ar' ? 'الباقة' : 'Plan'}</span>
                            <span className="text-xl font-bold">{planName[language]}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">{language === 'ar' ? 'الحالة' : 'Status'}</span>
                            <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                                {subscription?.status || 'No Active Subscription'}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">{language === 'ar' ? 'ينتهي في' : 'Renews on'}</span>
                            <span>
                                {subscription?.current_period_end
                                    ? new Date(subscription.current_period_end).toLocaleDateString()
                                    : '-'}
                            </span>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="outline">
                            {language === 'ar' ? 'تواصل معنا للترقية' : 'Contact Support to Upgrade'}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Usage Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>{language === 'ar' ? 'الاستخدام' : 'Usage Limits'}</CardTitle>
                        <CardDescription>{language === 'ar' ? 'استهلاكك الحالي للموارد' : 'Your current resource usage'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Products Usage */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>{language === 'ar' ? 'المنتجات' : 'Products'}</span>
                                <span>{productsUsed} / {productsLimit === -1 ? '∞' : productsLimit}</span>
                            </div>
                            <Progress value={productsPercentage} className="h-2" />
                            {productsPercentage >= 100 && (
                                <p className="text-xs text-red-500 font-medium mt-1">
                                    {language === 'ar' ? 'تم الوصول للحد الأقصى!' : 'Limit Reached!'}
                                </p>
                            )}
                        </div>

                        {/* Orders Usage */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>{language === 'ar' ? 'الطلبات الشهرية' : 'Monthly Orders'}</span>
                                <span>{ordersUsed} / {ordersLimit === -1 ? '∞' : ordersLimit}</span>
                            </div>
                            <Progress value={ordersPercentage} className="h-2" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <p className="text-xs text-muted-foreground">
                            {language === 'ar'
                                ? 'يتم إعادة تعيين حدود الطلبات شهرياً.'
                                : 'Order limits reset monthly.'}
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
