import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Call the secure RPC that only returns data if the user is unverified
        const { data, error } = await supabase
            .rpc('get_unverified_user_by_email', {
                p_email: email,
            });

        if (error) {
            console.error('[unverified-user] RPC error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch user' },
                { status: 500 }
            );
        }

        if (!data || data.length === 0) {
            return NextResponse.json(
                { error: 'User not found or is already verified.' },
                { status: 404 }
            );
        }

        // RPC returns an array (table), we just need the first item
        const user = data[0];

        return NextResponse.json({
            userId: user.user_id,
            phone: user.user_phone,
        });

    } catch (error) {
        console.error('[unverified-user] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
