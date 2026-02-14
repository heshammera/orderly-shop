import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStoreRole } from '@/hooks/useStoreRole';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: ('owner' | 'admin' | 'editor' | 'support')[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { storeId } = useParams<{ storeId: string }>();
    const { role, isLoading } = useStoreRole(storeId);
    const navigate = useNavigate();
    const { language } = useLanguage();

    useEffect(() => {
        if (!isLoading && role) {
            const hasPermission = allowedRoles.includes(role as any);

            if (!hasPermission) {
                toast.error(language === 'ar' ? 'ليس لديك صلاحية للوصول هذه الصفحة' : 'You do not have permission to access this page');
                navigate(`/store/${storeId}`);
            }
        }
    }, [role, isLoading, allowedRoles, navigate, storeId, language]);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Double check just in case, though the useEffect handles the redirect
    if (role && !allowedRoles.includes(role as any)) {
        return null;
    }

    return <>{children}</>;
}
