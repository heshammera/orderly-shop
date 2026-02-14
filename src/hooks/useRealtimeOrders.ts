import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function useRealtimeOrders(storeId: string, setOrders: React.Dispatch<React.SetStateAction<any[]>>) {
    const supabase = createClient();

    useEffect(() => {
        if (!storeId) return;

        const channel = supabase
            .channel('orders-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `store_id=eq.${storeId}`,
                },
                (payload: any) => {
                    console.log('Realtime Order Event:', payload);

                    if (payload.eventType === 'INSERT') {
                        const newOrder = payload.new;
                        setOrders((prev) => [newOrder, ...prev]);
                        toast.success('New Order Received! 🔔');
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedOrder = payload.new;
                        setOrders((prev) =>
                            prev.map((order) =>
                                order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
                            )
                        );
                    } else if (payload.eventType === 'DELETE') {
                        const deletedOrderId = payload.old.id;
                        setOrders((prev) => prev.filter((order) => order.id !== deletedOrderId));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [storeId, supabase, setOrders]);
}
