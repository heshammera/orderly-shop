"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { UserManagement } from '@/components/admin/UserManagement';

export default function AdminUsersPage() {
    const { language } = useLanguage();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">
                    {language === 'ar' ? 'إدارة المستخدمين' : 'User Management'}
                </h1>
                <p className="text-muted-foreground">
                    {language === 'ar' ? 'إدارة حسابات أصحاب المتاجر والمستخدمين.' : 'Manage store owners and user accounts.'}
                </p>
            </div>

            <UserManagement />
        </div>
    );
}
