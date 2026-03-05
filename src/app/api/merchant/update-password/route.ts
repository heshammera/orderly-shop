import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Current password and new password are required' },
                { status: 400 }
            );
        }

        // 1. Get current authenticated user
        const supabaseUser = createClient();
        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

        if (authError || !user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminClient = createAdminClient();

        // 2. Verify current password by signing in with the admin client
        // This is necessary because Supabase updateUser doesn't verify the old password by default
        const { error: signInError } = await adminClient.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
        });

        if (signInError) {
            return NextResponse.json({ error: 'invalid_current_password', message: signInError.message }, { status: 400 });
        }

        // 3. Update to the new password using the admin client for reliability
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (updateError) {
            console.error('[update-password] Failed to update:', updateError);
            return NextResponse.json({ error: 'Failed to update password', message: updateError.message }, { status: 500 });
        }

        // Optionally, you might want to call adminClient.auth.signOut() here 
        // to clear the admin session, though it shouldn't persist across requests.

        return NextResponse.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('[update-password] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
