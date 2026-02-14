"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { OrdersTable } from '@/components/dashboard/OrdersTable';

export default function OrdersPage({ params }: { params: { storeId: string } }) {
    const { language } = useLanguage();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">
                    {language === 'ar' ? 'الطلبات' : 'Orders'}
                </h1>
                <p className="text-muted-foreground">
                    {language === 'ar' ? 'عرض وإدارة طلبات العملاء' : 'View and manage customer orders'}
                </p>
            </div>

            <OrdersTable storeId={params.storeId} />
        </div>
    );
}
