import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
    try {
        const adminDb = createAdminClient();

        // Find conversations where:
        // 1. the last message was from 'user'
        // 2. it has been over 5 minutes (300 seconds)
        // 3. no 'admin' message has been sent since then
        // 4. status is still 'open' (or we just care about time)

        // To do this efficiently, we just check conversations updated > 5 mins ago that still have unread_admin_count > 0 
        // AND haven't received the apology yet (which would reset or change state, but let's just use a simple flag or message search)

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        // Get conversations with unread admin messages that were last updated > 5 mins ago
        const { data: delayedConvs, error: fetchError } = await adminDb
            .from('support_conversations')
            .select('id, unread_admin_count, updated_at, unread_user_count')
            .eq('status', 'open')
            .gt('unread_admin_count', 0)
            .lte('updated_at', fiveMinutesAgo);

        if (fetchError) throw fetchError;

        if (!delayedConvs || delayedConvs.length === 0) {
            return NextResponse.json({ success: true, processed: 0 });
        }

        let processed = 0;

        for (const conv of delayedConvs) {
            // Ensure we haven't already sent an apology recently.
            // Let's check the last message in this conversation.
            const { data: lastMessage } = await adminDb
                .from('support_messages')
                .select('sender_type, content')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            // If the last message was from the user AND we haven't replied...
            if (lastMessage && lastMessage.sender_type === 'user') {

                // Send apology
                const autoReplyContent = 'نعتذر على التأخير، نحن مشغولون بخدمة عملاء آخرين حالياً، نرجو الانتظار وسنكون معك قريباً جداً!';

                await adminDb
                    .from('support_messages')
                    .insert({
                        conversation_id: conv.id,
                        sender_type: 'admin',
                        content: autoReplyContent
                    });

                // Update conversation to reflect the admin reply so it doesn't trigger again immediately
                await adminDb
                    .from('support_conversations')
                    .update({
                        unread_user_count: (conv.unread_user_count || 0) + 1,
                        updated_at: new Date().toISOString()
                        // Note: we DO NOT reset unread_admin_count because the admin still hasn't read the user's message!
                    })
                    .eq('id', conv.id);

                processed++;
            }
        }

        return NextResponse.json({ success: true, processed });

    } catch (error: any) {
        console.error('Bot Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
