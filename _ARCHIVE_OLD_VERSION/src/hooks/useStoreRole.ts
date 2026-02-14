import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useStoreRole(storeId: string | undefined) {
    const { user, loading: authLoading } = useAuth();

    const { data: role, isLoading: queryLoading } = useQuery({
        queryKey: ['store-role', storeId, user?.id],
        queryFn: async () => {
            if (!user || !storeId) return null;

            // 1. Check if owner
            const { data: store, error: storeError } = await supabase
                .from('stores')
                .select('owner_id')
                .eq('id', storeId)
                .single();

            if (storeError) {
                console.error('Error fetching store owner:', storeError);
                return null;
            }

            if (store?.owner_id === user.id) return 'owner';

            // 2. Check if member
            const { data: member, error: memberError } = await supabase
                .from('store_members')
                .select('role')
                .eq('store_id', storeId)
                .eq('user_id', user.id)
                .maybeSingle();

            if (memberError) {
                console.error('Error fetching store member role:', memberError);
            }

            return member?.role || null;
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
