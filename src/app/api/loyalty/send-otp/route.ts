import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { storeId, phone } = body;

        // Validate inputs
        if (!storeId || !phone) {
            return NextResponse.json(
                { error: 'Missing required fields: storeId, phone' },
                { status: 400 }
            );
        }

        const phoneRegex = /^\+?[1-9]\d{6,14}$/;
        const cleanPhone = phone.replace(/\s/g, '');
        if (!phoneRegex.test(cleanPhone)) {
            return NextResponse.json(
                { error: 'Invalid phone number format' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Generate OTP via RPC for Guest
        const { data: otpResult, error: otpError } = await supabase
            .rpc('generate_guest_otp', {
                p_store_id: storeId,
                p_phone: cleanPhone,
            });

        if (otpError) {
            console.error('[loyalty/send-otp] RPC error:', otpError);
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

        // TEMPORARILY DISABLED — skip WhatsApp delivery
        console.log('[loyalty/send-otp] BYPASS MODE: OTP generated but delivery skipped. Code:', otpResult.code);
        /*
        try {
            // Send directly to WAHA for WhatsApp
            const wahaUrl = process.env.WAHA_API_URL;
            const wahaKey = process.env.WAHA_API_KEY;

            if (!wahaUrl || !wahaKey) {
                console.error('[loyalty/send-otp] WAHA credentials not configured');
                return NextResponse.json({ error: 'WhatsApp service not configured' }, { status: 500 });
            }

            // Format: Remove non-digits and append @c.us
            const formattedDestination = cleanPhone.replace(/\D/g, '') + '@c.us';

            // Custom Message for Loyalty Program
            const messageText = `*Orderly | أوردلي*\n\nكود الخصم وبرنامج الولاء الخاص بك هو:\n*${otpResult.code}*\n\nYour loyalty discount code is:\n*${otpResult.code}*\n\nينتهي الكود خلال 5 دقائق / Expires in 5 minutes.`;

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
                console.error('[loyalty/send-otp] WAHA direct send failed:', wahaResponse.status, await wahaResponse.text());
            }

        } catch (deliveryError) {
            console.error('[loyalty/send-otp] delivery error:', deliveryError);
            // Non-blocking — code is still in DB, user can request resend
        }
        */

        return NextResponse.json({
            success: true,
            message: 'Verification code sent',
            expiresIn: otpResult.expires_in,
        });

    } catch (error) {
        console.error('[loyalty/send-otp] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
