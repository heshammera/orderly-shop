import { SupabaseClient } from '@supabase/supabase-js';

export type NotificationType = 'order' | 'stock' | 'system' | 'review' | 'customer';

export interface CreateNotificationParams {
    store_id: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    data?: any;
}

/**
 * Helper function to create a new notification in the database
 * AND send a push notification to registered mobile devices
 */
export async function createNotification(
    supabase: SupabaseClient,
    params: CreateNotificationParams
) {
    try {
        // 1. Insert into database
        const { data: dbData, error } = await supabase
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
            console.error('Error creating notification in DB:', error);
        }

        // 2. Send Push Notification via Expo
        try {
            // Fetch push tokens for this store
            const { data: tokenData } = await supabase
                .from('push_tokens')
                .select('token')
                .eq('store_id', params.store_id);

            if (tokenData && tokenData.length > 0) {
                const expoTokens = tokenData.map(t => t.token);

                // Construct Expo push messages
                const messages = expoTokens.map(token => ({
                    to: token,
                    sound: 'default',
                    title: params.title,
                    body: params.message,
                    data: {
                        url: params.link,
                        type: params.type,
                        ...params.data
                    },
                }));

                // Send to Expo API
                await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Accept-encoding': 'gzip, deflate',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(messages),
                });
            }
        } catch (pushError) {
            console.error('Failed to send push notification:', pushError);
        }

        return { success: true, data: dbData };
    } catch (err) {
        console.error('Unexpected error in notification service:', err);
        return { success: false, error: err };
    }
}
