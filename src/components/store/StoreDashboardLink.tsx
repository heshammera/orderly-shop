"use client";

import { useStoreRole } from '@/hooks/useStoreRole';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export function StoreDashboardLink({ storeId, storeSlug }: { storeId: string; storeSlug?: string }) {
    const { language } = useLanguage();
    const { isAdmin, isEditor, isOwner, isLoading } = useStoreRole(storeId);

    const hasAccess = isAdmin || isEditor || isOwner;

    // Always show the button - either dashboard or login
    if (isLoading) {
        return null; // Don't show until we know the status
    }

    if (hasAccess) {
        // Show Dashboard button for users with access
        return (
            <>
                {/* Desktop - with text */}
                <Link href={storeSlug ? `/dashboard` : `/dashboard/${storeId}`} className="hidden md:block">
                    <Button variant="default" size="sm" className="gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                    </Button>
                </Link>

                {/* Mobile - icon only */}
                <Link href={storeSlug ? `/dashboard` : `/dashboard/${storeId}`} className="md:hidden">
                    <Button variant="default" size="icon">
                        <LayoutDashboard className="w-5 h-5" />
                    </Button>
                </Link>
            </>
        );
    }

    // Show Login button for visitors - use relative path to stay on subdomain
    return (
        <>
            {/* Desktop - with text */}
            <Link href="/login" className="hidden md:block">
                <Button variant="outline" size="sm" className="gap-2">
                    <LogIn className="w-4 h-4" />
                    {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                </Button>
            </Link>

            {/* Mobile - icon only */}
            <Link href="/login" className="md:hidden">
                <Button variant="ghost" size="icon">
                    <LogIn className="w-5 h-5" />
                </Button>
            </Link>
        </>
    );
}
