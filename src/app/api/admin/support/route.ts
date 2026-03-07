import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    try {
        const adminDb = createAdminClient();

        // Fetch conversations with store details if merchant
        const { data: conversations, error } = await adminDb
            .from('support_conversations')
            .select(`
                *,
                stores (
                    name,
                    slug
                )
            `)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ conversations: conversations || [] });

    } catch (error: any) {
        console.error('Error fetching admin chats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
