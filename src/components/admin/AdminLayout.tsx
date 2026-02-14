"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const { dir } = useLanguage();

    return (
        <div className="min-h-screen bg-background" dir={dir}>
            <AdminSidebar />
            <main className="lg:ps-64">
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
