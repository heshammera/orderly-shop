import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSessionToken } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const token = await getAdminSessionToken();
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();

        // Validate admin session
        const { data: validation, error: authError } = await supabase.rpc('validate_super_admin_session', { p_token: token });
        if (authError || !validation || !validation.valid) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Clean up stale users first
        await supabase.rpc('cleanup_stale_online_users');

        // Get all currently online users (last_seen within 60 seconds)
        const cutoff = new Date(Date.now() - 60 * 1000).toISOString();
        const { data: onlineUsers, error } = await supabase
            .from('online_users')
            .select('*')
            .gte('last_seen', cutoff)
            .order('last_seen', { ascending: false });

        if (error) {
            console.error('Error fetching online users:', error);
            return NextResponse.json({ error: 'Failed to fetch online users' }, { status: 500 });
        }

        const users = onlineUsers || [];
        const admins = users.filter(u => u.user_type === 'admin');
        const storeOwners = users.filter(u => u.user_type === 'store_owner');
        const visitors = users.filter(u => u.user_type === 'visitor');

        return NextResponse.json({
            total: users.length,
            admins: admins.length,
            storeOwners: storeOwners.length,
            visitors: visitors.length,
            users,
        });
    } catch (error) {
        console.error('Online users API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
