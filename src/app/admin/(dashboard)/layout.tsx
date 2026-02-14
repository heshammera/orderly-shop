"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Loader2 } from 'lucide-react';

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Determine if we are on the login page (should not happen due to route group, but safety check)
                if (window.location.pathname.includes('/login')) {
                    setLoading(false);
                    return;
                }

                const res = await fetch('/api/admin/me');
                if (!res.ok) {
                    throw new Error('Unauthorized');
                }
                const data = await res.json();

                if (!data.user) {
                    throw new Error('No user data');
                }

                setAuthorized(true);
                setLoading(false);
            } catch (error) {
                console.error("Admin Auth Check Failed:", error);
                router.push('/admin/login');
            }
        };

        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!authorized) {
        return null; // Will redirect
    }

    return (
        <AdminLayout>
            {children}
        </AdminLayout>
    );
}
