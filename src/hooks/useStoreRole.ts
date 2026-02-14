import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export function useStoreRole(storeId: string | undefined) {
    const supabase = createClient();
    const { user, loading: authLoading } = useAuth();

    const { data: role, isLoading: queryLoading } = useQuery({
        queryKey: ['store-role', storeId, user?.id],
        queryFn: async () => {
            if (!user || !storeId) return null;

            const { data, error } = await supabase
                .rpc('get_user_role', { p_store_id: storeId });

            if (error) {
                // Ignore specific non-critical errors or just log warning
                console.warn('Error fetching store role:', error.message || error);
                return null;
            }

            return data;
        },
        enabled: !!user && !!storeId && !authLoading,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const isLoading = authLoading || queryLoading;

    return {
        role,
        isLoading,
        isOwner: role === 'owner',
        isAdmin: role === 'owner' || role === 'admin',
        isEditor: role === 'owner' || role === 'admin' || role === 'editor',
        isSupport: role === 'owner' || role === 'admin' || role === 'editor' || role === 'support',
        // Exact checks for specific UI elements
        isExactAdmin: role === 'admin',
        isExactEditor: role === 'editor',
        isExactSupport: role === 'support'
    };
}
