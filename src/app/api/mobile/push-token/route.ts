import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
    try {
        const { token, storeId } = await req.json();

        if (!token || !storeId) {
            return NextResponse.json({ error: 'Missing token or storeId' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Store token in 'push_tokens' table
        // We use upsert on the token to avoid duplicates
        const { error } = await supabase.from('push_tokens').upsert({
            token,
            store_id: storeId,
            updated_at: new Date().toISOString()
        }, { onConflict: 'token' });

        if (error) {
            console.error('Supabase error saving push token:', error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Push token registered successfully' });
    } catch (err: any) {
        console.error('Push token registration fatal error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
