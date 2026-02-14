import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface PlanLimits {
    products: number;
    orders_monthly: number;
    staff: number;
}

export interface SubscriptionData {
    plan: {
        id: string;
        name: { ar: string; en: string };
        slug: string;
        limits: PlanLimits;
    };
    status: string;
    current_period_end: string;
}

export function useSubscription(storeId: string) {
    const supabase = createClient();

    // Fetch Subscription and Plan (Account Level)
    const { data: subscription, isLoading: subLoading } = useQuery({
        queryKey: ['subscription', storeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .rpc('get_store_effective_plan', { p_store_id: storeId });

            if (error) throw error;

            if (!data || !data.has_plan) return null;

            // Map RPC result to partial SubscriptionData structure
            return {
                plan: data.plan,
                status: data.subscription.status,
                current_period_end: data.subscription.current_period_end,
                source_store_id: data.subscription.source_store_id
            } as any;
        },
        enabled: !!storeId,
    });

    // Fetch Usage Records
    const { data: usage, isLoading: usageLoading } = useQuery({
        queryKey: ['usage', storeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('usage_records')
                .select('*')
                .eq('store_id', storeId);

            if (error) throw error;

            // Transform to object for easier access
            const usageMap: Record<string, number> = {};
            data?.forEach((record: any) => {
                usageMap[record.metric] = record.value;
            });
            return usageMap;
        },
        enabled: !!storeId,
    });

    // Map features from JSON to the expected limits structure
    // Plan features example: { "products_limit": 50, "stores_limit": 1 }
    const features = subscription?.plan?.features || {};

    const limits: PlanLimits = {
        products: features.products_limit !== undefined ? features.products_limit : 0,
        orders_monthly: features.orders_limit !== undefined ? features.orders_limit : -1, // Default unlimited if not specified
        staff: features.staff_limit !== undefined ? features.staff_limit : 0,
    };

    // Check Functions
    const canAddProduct = () => {
        if (!subscription) return false; // No sub = No access
        if (limits.products === -1) return true; // Unlimited
        const currentCount = usage?.['products_count'] || 0;
        return currentCount < limits.products;
    };

    // Handle localized name (it might be in 'name' JSON or 'name_ar'/'name_en' columns)
    // The new schema has name_ar and name_en columns, plus a name JSON column.
    // We try to be robust.
    const planName = subscription?.plan ? {
        ar: subscription.plan.name_ar || subscription.plan.name?.ar || 'غير معروف',
        en: subscription.plan.name_en || subscription.plan.name?.en || 'Unknown'
    } : { ar: 'غير مشترك', en: 'No Plan' };

    return {
        subscription,
        limits,
        usage,
        isLoading: subLoading || usageLoading,
        canAddProduct,
        planName,
    };
}
