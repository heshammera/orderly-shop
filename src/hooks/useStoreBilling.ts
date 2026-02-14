import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useStoreBilling(storeId: string | undefined) {
    const supabase = createClient();
    const { data: billingStatus, isLoading } = useQuery({
        queryKey: ['store-billing-status', storeId],
        queryFn: async () => {
            if (!storeId) return null;
            const { data, error } = await supabase
                .from('stores')
                .select('balance, has_unlimited_balance')
                .eq('id', storeId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!storeId,
    });

    const isLocked = billingStatus ? (!billingStatus.has_unlimited_balance && (billingStatus.balance ?? 0) <= 0) : false;

    return {
        isLocked,
        balance: billingStatus?.balance || 0,
        isLoading
    };
}
