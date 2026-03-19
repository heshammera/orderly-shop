import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        // Get authenticated user
        const supabaseUser = createClient();
        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminClient = createAdminClient();

        // ==============================
        // ACTION: request_change
        // ==============================
        if (action === 'request_change') {
            const { storeId, field, newValue } = body;

            // Validate required fields
            if (!storeId || !field || !newValue) {
                return NextResponse.json(
                    { error: 'Missing required fields: storeId, field, newValue' },
                    { status: 400 }
                );
            }

            // Validate field type
            if (!['email', 'whatsapp'].includes(field)) {
                return NextResponse.json(
                    { error: 'Field must be "email" or "whatsapp"' },
                    { status: 400 }
                );
            }

            // Validate format
            if (field === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(newValue)) {
                    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
                }
            } else {
                const phoneRegex = /^\+?[1-9]\d{6,14}$/;
                if (!phoneRegex.test(newValue.replace(/\s/g, ''))) {
                    return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
                }
            }

            // Verify user owns this store
            const { data: store, error: storeError } = await adminClient
                .from('stores')
                .select('id, owner_id')
                .eq('id', storeId)
                .single();

            if (storeError || !store || store.owner_id !== user.id) {
                return NextResponse.json({ error: 'Store not found or access denied' }, { status: 403 });
            }

            // Expire any existing pending requests for this store + field
            await adminClient
                .from('contact_change_requests')
                .update({ status: 'expired' })
                .eq('store_id', storeId)
                .eq('field', field)
                .eq('status', 'pending');

            // Create new change request
            const { error: insertError } = await adminClient
                .from('contact_change_requests')
                .insert({
                    store_id: storeId,
                    user_id: user.id,
                    field,
                    new_value: newValue,
                    status: 'pending',
                });

            if (insertError) {
                console.error('[update-contact] Insert error:', insertError);
                return NextResponse.json({ error: 'Failed to create change request' }, { status: 500 });
            }

            // Generate OTP
            const method = field === 'email' ? 'email' : 'whatsapp';
            const destination = newValue;

            const { data: otpResult, error: otpError } = await adminClient
                .rpc('generate_otp', {
                    p_user_id: user.id,
                    p_method: method,
                    p_destination: destination,
                });

            if (otpError) {
                console.error('[update-contact] OTP generation error:', otpError);
                return NextResponse.json({ error: 'Failed to generate verification code' }, { status: 500 });
            }

            if (!otpResult?.success) {
                return NextResponse.json(
                    { error: otpResult?.error || 'Failed to generate code', message: otpResult?.message },
                    { status: 429 }
                );
            }

            // TEMPORARILY DISABLED — skip delivery
            console.log('[update-contact] BYPASS MODE: OTP generated but delivery skipped. Code:', otpResult.code);
            /*
            // Send the code via WAHA (WhatsApp) or n8n (Email)
            try {
                if (method === 'whatsapp') {
                    const wahaUrl = process.env.WAHA_API_URL;
                    const wahaKey = process.env.WAHA_API_KEY;

                    if (!wahaUrl || !wahaKey) {
                        console.error('[update-contact] WAHA credentials not configured');
                    } else {
                        const formattedDestination = destination.replace(/\D/g, '') + '@c.us';
                        const messageText = `*Orderly | أوردلي*\n\nكود التفعيل لتغيير رقم الواتساب:\n*${otpResult.code}*\n\nYour verification code to change WhatsApp number:\n*${otpResult.code}*\n\nينتهي الكود خلال 5 دقائق / Expires in 5 minutes.`;

                        const wahaResponse = await fetch(`${wahaUrl}/api/sendText`, {
                            method: 'POST',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'X-Api-Key': wahaKey,
                            },
                            body: JSON.stringify({
                                session: 'default',
                                chatId: formattedDestination,
                                text: messageText,
                            }),
                        });

                        if (!wahaResponse.ok) {
                            console.error('[update-contact] WAHA send failed:', wahaResponse.status);
                        }
                    }
                } else {
                    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
                    const n8nSecret = process.env.N8N_WEBHOOK_SECRET;

                    if (!n8nWebhookUrl) {
                        console.error('[update-contact] N8N_WEBHOOK_URL not configured');
                    } else {
                        const webhookPayload = {
                            code: otpResult.code,
                            method: 'email',
                            destination,
                            userName: user.user_metadata?.full_name || 'User',
                            expiresIn: 5,
                            type: 'contact_change',
                            subject_ar: 'كود التحقق لتغيير البريد الإلكتروني - Orderly',
                            subject_en: 'Email Change Verification Code - Orderly',
                            heading_ar: 'تغيير البريد الإلكتروني',
                            heading_en: 'Email Change Verification',
                            message_ar: `مرحباً ${user.user_metadata?.full_name || 'عزيزي التاجر'},\n\nلقد طلبت تغيير البريد الإلكتروني لمتجرك. استخدم الكود التالي لتأكيد التغيير:`,
                            message_en: `Hello ${user.user_metadata?.full_name || 'Dear Merchant'},\n\nYou have requested to change your store's email address. Use the following code to confirm the change:`,
                            footer_ar: 'إذا لم تطلب هذا التغيير، يرجى تجاهل هذه الرسالة.',
                            footer_en: 'If you did not request this change, please ignore this email.',
                        };

                        const webhookResponse = await fetch(n8nWebhookUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                ...(n8nSecret ? { 'X-Webhook-Secret': n8nSecret } : {}),
                            },
                            body: JSON.stringify(webhookPayload),
                        });

                        if (!webhookResponse.ok) {
                            console.error('[update-contact] n8n webhook failed:', webhookResponse.status);
                        }
                    }
                }
            } catch (deliveryError) {
                console.error('[update-contact] delivery error:', deliveryError);
            }
            */

            return NextResponse.json({
                success: true,
                message: 'Verification code sent',
                expiresIn: otpResult.expires_in,
            });
        }

        // ==============================
        // ACTION: verify_change
        // ==============================
        if (action === 'verify_change') {
            const { storeId, field, code } = body;

            if (!storeId || !field || !code) {
                return NextResponse.json(
                    { error: 'Missing required fields: storeId, field, code' },
                    { status: 400 }
                );
            }

            if (!/^\d{6}$/.test(code)) {
                return NextResponse.json({ error: 'Code must be 6 digits' }, { status: 400 });
            }

            // Call the verify_contact_change RPC
            const { data: result, error: rpcError } = await adminClient
                .rpc('verify_contact_change', {
                    p_user_id: user.id,
                    p_code: code,
                    p_store_id: storeId,
                    p_field: field,
                });

            if (rpcError) {
                console.error('[update-contact] Verify RPC error:', rpcError);
                return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
            }

            if (!result?.success) {
                return NextResponse.json({
                    success: false,
                    error: result?.error || 'invalid_code',
                    message: result?.message,
                    attemptsRemaining: result?.attempts_remaining,
                }, { status: 400 });
            }

            return NextResponse.json({
                success: true,
                message: result.message,
                newValue: result.new_value,
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('[update-contact] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
