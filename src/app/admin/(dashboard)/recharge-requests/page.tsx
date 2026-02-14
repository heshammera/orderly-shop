"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { AdminRechargeRequests } from '@/components/admin/AdminRechargeRequests';

export default function AdminRechargeRequestsPage() {
    const { language } = useLanguage();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">
                    {language === 'ar' ? 'طلبات الشحن' : 'Recharge Requests'}
                </h1>
                <p className="text-muted-foreground">
                    {language === 'ar' ? 'مراجعة وإدارة طلبات شحن المحفظة الواردة من المتاجر.' : 'Review and manage incoming wallet recharge requests from stores.'}
                </p>
            </div>

            <AdminRechargeRequests />
        </div>
    );
}
