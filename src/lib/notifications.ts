import { SupabaseClient } from '@supabase/supabase-js';

export type NotificationType = 'order' | 'stock' | 'system' | 'review' | 'customer';

export interface CreateNotificationParams {
    store_id: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
}

/**
 * Helper function to create a new notification in the database
 */
export async function createNotification(
    supabase: SupabaseClient,
    params: CreateNotificationParams
) {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert([{
                store_id: params.store_id,
                title: params.title,
                message: params.message,
                type: params.type,
                link: params.link,
                is_read: false
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating notification:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (err) {
        console.error('Unexpected error creating notification:', err);
        return { success: false, error: err };
    }
}
