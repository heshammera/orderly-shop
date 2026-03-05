import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, method, destination, userName } = body;

        // Validate inputs
        if (!userId || !method || !destination) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, method, destination' },
                { status: 400 }
            );
        }

        if (!['whatsapp', 'email'].includes(method)) {
            return NextResponse.json(
                { error: 'Method must be "whatsapp" or "email"' },
                { status: 400 }
            );
        }

        // Validate phone format for whatsapp
        if (method === 'whatsapp') {
            const phoneRegex = /^\+?[1-9]\d{6,14}$/;
            if (!phoneRegex.test(destination.replace(/\s/g, ''))) {
                return NextResponse.json(
                    { error: 'Invalid phone number format' },
                    { status: 400 }
                );
            }
        }

        const supabase = createAdminClient();

        // Generate OTP via RPC
        const { data: otpResult, error: otpError } = await supabase
            .rpc('generate_otp', {
                p_user_id: userId,
                p_method: method,
                p_destination: destination,
            });

        if (otpError) {
            console.error('[send-otp] RPC error:', otpError);
            return NextResponse.json(
                { error: 'Failed to generate verification code' },
                { status: 500 }
            );
        }

        if (!otpResult?.success) {
            return NextResponse.json(
                { error: otpResult?.error || 'Failed to generate code', message: otpResult?.message },
                { status: 429 }
            );
        }

        try {
            if (method === 'whatsapp') {
                // Send directly to WAHA for WhatsApp (bypass n8n completely)
                const wahaUrl = process.env.WAHA_API_URL;
                const wahaKey = process.env.WAHA_API_KEY;

                if (!wahaUrl || !wahaKey) {
                    console.error('[send-otp] WAHA credentials not configured');
                    return NextResponse.json({ error: 'WhatsApp service not configured' }, { status: 500 });
                }

                // Format: Remove non-digits and append @c.us
                const formattedDestination = destination.replace(/\D/g, '') + '@c.us';

                // Message in Arabic/English
                const messageText = `*Orderly | أوردلي*\n\nكود التفعيل الخاص بك هو:\n*${otpResult.code}*\n\nYour verification code is:\n*${otpResult.code}*\n\nينتهي الكود خلال 5 دقائق / Expires in 5 minutes.`;

                const wahaResponse = await fetch(`${wahaUrl}/api/sendText`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Api-Key': wahaKey
                    },
                    body: JSON.stringify({
                        session: 'default',
                        chatId: formattedDestination,
                        text: messageText
                    })
                });

                if (!wahaResponse.ok) {
                    console.error('[send-otp] WAHA direct send failed:', wahaResponse.status, await wahaResponse.text());
                }

            } else {
                // Send webhook to n8n for Email 
                const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
                const n8nSecret = process.env.N8N_WEBHOOK_SECRET;

                if (!n8nWebhookUrl) {
                    console.error('[send-otp] N8N_WEBHOOK_URL is not configured');
                    return NextResponse.json({ error: 'Notification service not configured' }, { status: 500 });
                }

                const webhookPayload = {
                    code: otpResult.code,
                    method,
                    destination,
                    userName: userName || 'User',
                    expiresIn: 5, // minutes
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
                    console.error('[send-otp] n8n webhook failed:', webhookResponse.status, await webhookResponse.text());
                }
            }
        } catch (deliveryError) {
            console.error('[send-otp] delivery error:', deliveryError);
            // Non-blocking — code is still in DB, user can request resend
        }

        return NextResponse.json({
            success: true,
            message: 'Verification code sent',
            expiresIn: otpResult.expires_in,
        });

    } catch (error) {
        console.error('[send-otp] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
