import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const adminDb = createAdminClient();

        const { data: userAuth } = await supabase.auth.getUser();
        const sessionId = request.headers.get('x-session-id');

        let isMerchant = false;
        let storeId = null;

        if (userAuth?.user) {
            const { data: store } = await adminDb
                .from('stores')
                .select('id')
                .eq('owner_id', userAuth.user.id)
                .limit(1)
                .single();

            if (store) {
                isMerchant = true;
                storeId = store.id;
            }
        }

        if (!isMerchant && !sessionId) {
            return NextResponse.json({ error: 'Unauthorized or missing session ID' }, { status: 401 });
        }

        let conversation;

        if (isMerchant) {
            const { data } = await adminDb
                .from('support_conversations')
                .select('*')
                .eq('store_id', storeId)
                .eq('user_type', 'merchant')
                .limit(1)
                .single();
            conversation = data;
        } else {
            const { data } = await adminDb
                .from('support_conversations')
                .select('*')
                .eq('session_id', sessionId)
                .eq('user_type', 'guest')
                .limit(1)
                .single();
            conversation = data;
        }

        if (!conversation) {
            return NextResponse.json({ messages: [], unreadCount: 0 });
        }

        const { data: messages } = await adminDb
            .from('support_messages')
            .select('*')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true });

        return NextResponse.json({
            conversationId: conversation.id,
            messages: messages || [],
            unreadCount: conversation.unread_user_count
        });

    } catch (error: any) {
        console.error('Error fetching chat:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const adminDb = createAdminClient();

        const { data: userAuth } = await supabase.auth.getUser();
        const sessionId = request.headers.get('x-session-id');

        const body = await request.json();
        const { content, guestName, guestEmail, image_url, message_type } = body;

        if (!content && !image_url) return NextResponse.json({ error: 'Content required' }, { status: 400 });

        let isMerchant = false;
        let storeId: string | null = null;
        let userId: string | null = null;

        if (userAuth?.user) {
            const { data: store } = await adminDb
                .from('stores')
                .select('id')
                .eq('owner_id', userAuth.user.id)
                .limit(1)
                .single();

            if (store) {
                isMerchant = true;
                storeId = store.id;
                userId = userAuth.user.id;
            }
        }

        if (!isMerchant && !sessionId) {
            return NextResponse.json({ error: 'Unauthorized or missing session ID' }, { status: 401 });
        }

        let conversation;
        let isNewConversation = false;

        // Find or create conversation
        if (isMerchant) {
            const { data } = await adminDb
                .from('support_conversations')
                .select('*')
                .eq('store_id', storeId)
                .eq('user_type', 'merchant')
                .limit(1)
                .single();
            conversation = data;

            if (!conversation) {
                const { data: newConv } = await adminDb
                    .from('support_conversations')
                    .insert({ store_id: storeId, user_type: 'merchant' })
                    .select()
                    .single();
                conversation = newConv;
                isNewConversation = true;
            }
        } else {
            const { data } = await adminDb
                .from('support_conversations')
                .select('*')
                .eq('session_id', sessionId)
                .eq('user_type', 'guest')
                .limit(1)
                .single();
            conversation = data;

            if (!conversation) {
                const { data: newConv } = await adminDb
                    .from('support_conversations')
                    .insert({ session_id: sessionId, user_type: 'guest', guest_name: guestName || 'Guest' })
                    .select()
                    .single();
                conversation = newConv;
                isNewConversation = true;
            }

            // Update guest name or email if they provide a new one
            let updates: any = {};
            if (guestName && conversation.guest_name !== guestName) {
                updates.guest_name = guestName;
            }
            if (guestEmail && conversation.guest_email !== guestEmail) {
                updates.guest_email = guestEmail;
            }

            if (Object.keys(updates).length > 0) {
                await adminDb
                    .from('support_conversations')
                    .update(updates)
                    .eq('id', conversation.id);
            }
        }

        // Insert Message
        const { data: message, error: insertError } = await adminDb
            .from('support_messages')
            .insert({
                conversation_id: conversation.id,
                sender_type: 'user',
                sender_id: isMerchant ? userId : sessionId,
                content: content || 'صورة مرفقة',
                image_url,
                message_type: message_type || 'text'
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // Auto-reply for new conversations
        if (isNewConversation) {
            const autoReplyContent = isMerchant
                ? 'أهلاً بك شريكنا العزيز، لقد استلمنا رسالتك وسارد عليك في أسرع وقت ممكن!'
                : 'أهلاً بك، لقد استلمنا رسالتك وسنرد عليك في أسرع وقت ممكن!';

            await adminDb
                .from('support_messages')
                .insert({
                    conversation_id: conversation.id,
                    sender_type: 'admin',
                    content: autoReplyContent
                });
        }

        // Update conversation counters and timestamp
        await adminDb
            .from('support_conversations')
            .update({
                unread_admin_count: (conversation.unread_admin_count || 0) + 1,
                unread_user_count: isNewConversation ? 1 : conversation.unread_user_count,
                status: 'open',
                updated_at: new Date().toISOString()
            })
            .eq('id', conversation.id);

        return NextResponse.json({ message });

    } catch (error: any) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = createClient();
        const adminDb = createAdminClient();

        const { data: userAuth } = await supabase.auth.getUser();
        const sessionId = request.headers.get('x-session-id');

        let isMerchant = false;
        let storeId = null;

        if (userAuth?.user) {
            const { data: store } = await adminDb
                .from('stores')
                .select('id')
                .eq('owner_id', userAuth.user.id)
                .limit(1)
                .single();

            if (store) {
                isMerchant = true;
                storeId = store.id;
            }
        }

        let conversationId;

        // Find conversation
        if (isMerchant) {
            const { data } = await adminDb
                .from('support_conversations')
                .select('id')
                .eq('store_id', storeId)
                .eq('user_type', 'merchant')
                .limit(1)
                .single();
            conversationId = data?.id;
        } else if (sessionId) {
            const { data } = await adminDb
                .from('support_conversations')
                .select('id')
                .eq('session_id', sessionId)
                .eq('user_type', 'guest')
                .limit(1)
                .single();
            conversationId = data?.id;
        }

        if (!conversationId) {
            return NextResponse.json({ success: true }); // Ignore if no conversation exists
        }

        // Mark all admin messages as read
        await adminDb
            .from('support_messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .eq('sender_type', 'admin')
            .eq('is_read', false);

        // Reset unread_user_count
        await adminDb
            .from('support_conversations')
            .update({ unread_user_count: 0 })
            .eq('id', conversationId);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error marking as read:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
