import { Link } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStoreRole } from '@/hooks/useStoreRole';

export function StoreDashboardLink({ storeId }: { storeId: string }) {
    const { isAdmin, isOwner, isEditor, isSupport } = useStoreRole(storeId);
    const { language } = useLanguage();

    // Show if user has any staff role
    const hasAccess = isAdmin || isOwner || isEditor || isSupport;

    if (!hasAccess) return null;

    return (
        <Link to={`/store/${storeId}`}>
            <Button variant="ghost" size="icon" title={language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}>
                <LayoutDashboard className="w-5 h-5" />
            </Button>
        </Link>
    );
}
