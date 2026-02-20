import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, code } = body;

        // Validate inputs
        if (!userId || !code) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, code' },
                { status: 400 }
            );
        }

        // Validate code format (6 digits)
        if (!/^\d{6}$/.test(code)) {
            return NextResponse.json(
                { error: 'Code must be 6 digits' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Verify OTP via RPC
        const { data: verifyResult, error: verifyError } = await supabase
            .rpc('verify_otp', {
                p_user_id: userId,
                p_code: code,
            });

        if (verifyError) {
            console.error('[verify-otp] RPC error:', verifyError);
            return NextResponse.json(
                { error: 'Failed to verify code' },
                { status: 500 }
            );
        }

        if (!verifyResult?.success) {
            return NextResponse.json({
                success: false,
                error: verifyResult?.error || 'invalid_code',
                message: verifyResult?.message,
                attemptsRemaining: verifyResult?.attempts_remaining,
            }, { status: 400 });
        }

        // OTP verified! Now confirm the user's email via Admin API
        try {
            const { error: updateError } = await supabase.auth.admin.updateUserById(
                userId,
                {
                    email_confirm: true,
                    // Also set phone if it was provided during verification
                }
            );

            if (updateError) {
                console.error('[verify-otp] Failed to confirm user email:', updateError);
                return NextResponse.json(
                    { error: 'Failed to activate account' },
                    { status: 500 }
                );
            }
        } catch (adminError) {
            console.error('[verify-otp] Admin API error:', adminError);
            return NextResponse.json(
                { error: 'Failed to activate account' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Account activated successfully',
        });

    } catch (error) {
        console.error('[verify-otp] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
