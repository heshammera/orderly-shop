import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { conversationId: string } }
) {
    try {
        const adminDb = createAdminClient();

        const { data: messages, error } = await adminDb
            .from('support_messages')
            .select('*')
            .eq('conversation_id', params.conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ messages: messages || [] });
    } catch (error: any) {
        console.error('Error fetching admin chat messages:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { conversationId: string } }
) {
    try {
        const adminDb = createAdminClient();

        const body = await request.json();
        const { content, message_type, image_url } = body;

        if (!content && message_type !== 'email_request' && !image_url) return NextResponse.json({ error: 'Content required' }, { status: 400 });

        // Insert admin reply
        const { data: message, error: insertError } = await adminDb
            .from('support_messages')
            .insert({
                conversation_id: params.conversationId,
                sender_type: 'admin',
                content: content || (image_url ? 'صورة مرفقة' : 'يرجى تسجيل بريدك الإلكتروني للتواصل'),
                image_url: image_url || null,
                message_type: message_type || 'text'
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // Update unread_user_count
        const { data: conv } = await adminDb
            .from('support_conversations')
            .select('unread_user_count')
            .eq('id', params.conversationId)
            .single();

        await adminDb
            .from('support_conversations')
            .update({
                unread_user_count: (conv?.unread_user_count || 0) + 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', params.conversationId);

        return NextResponse.json({ message });
    } catch (error: any) {
        console.error('Error sending admin reply:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { conversationId: string } }
) {
    try {
        const adminDb = createAdminClient();

        // Mark user messages as read
        await adminDb
            .from('support_messages')
            .update({ is_read: true })
            .eq('conversation_id', params.conversationId)
            .eq('sender_type', 'user')
            .eq('is_read', false);

        // Reset admin unread count
        await adminDb
            .from('support_conversations')
            .update({ unread_admin_count: 0 })
            .eq('id', params.conversationId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error marking admin chat as read:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
