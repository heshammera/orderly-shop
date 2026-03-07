import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
    request: NextRequest,
    { params }: { params: { storeId: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        // Check auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch notifications
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('store_id', params.storeId)
            .order('created_at', { ascending: false })
            .limit(50); // Get last 50 notifications

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get unread count
        const { count: unreadCount, error: countError } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', params.storeId)
            .eq('is_read', false);

        if (countError) {
            console.error('Error fetching unread count:', countError);
        }

        return NextResponse.json({
            notifications: data,
            unreadCount: unreadCount || 0
        });

    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { storeId: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        // Check auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Mark all as read
        if (body.action === 'mark_all_read') {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('store_id', params.storeId)
                .eq('is_read', false);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true });
        }

        // Mark specific notification as read
        if (body.action === 'mark_read' && body.notificationId) {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('store_id', params.storeId)
                .eq('id', body.notificationId);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Error updating notifications:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
