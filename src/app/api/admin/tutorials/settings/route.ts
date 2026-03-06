import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSessionToken } from '@/lib/admin-auth';

// Get tutorial settings
export async function GET() {
    try {
        const token = await getAdminSessionToken();
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabase = createAdminClient();
        const { data: validation, error: valError } = await supabase.rpc('validate_super_admin_session', { p_token: token });
        if (valError || !validation?.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Fetch settings
        const { data: landingSetting } = await supabase.rpc('get_setting', { setting_key: 'tutorials_enabled_landing' });
        const { data: dashboardSetting } = await supabase.rpc('get_setting', { setting_key: 'tutorials_enabled_dashboard' });

        const parseSetting = (val: any) => {
            if (val === null || val === undefined) return true;
            const strVal = String(val).replace(/"/g, '');
            return strVal === 'true';
        };

        return NextResponse.json({
            tutorials_enabled_landing: parseSetting(landingSetting),
            tutorials_enabled_dashboard: parseSetting(dashboardSetting),
        });
    } catch (error: any) {
        console.error('Error fetching tutorial settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update settings
export async function PATCH(req: Request) {
    try {
        const token = await getAdminSessionToken();
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabase = createAdminClient();
        const { data: validation, error: valError } = await supabase.rpc('validate_super_admin_session', { p_token: token });
        if (valError || !validation?.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const updates = await req.json();

        if (updates.tutorials_enabled_landing !== undefined) {
            await supabase.rpc('set_setting', {
                setting_key: 'tutorials_enabled_landing',
                setting_value: updates.tutorials_enabled_landing ? '"true"' : '"false"'
            });
        }

        if (updates.tutorials_enabled_dashboard !== undefined) {
            await supabase.rpc('set_setting', {
                setting_key: 'tutorials_enabled_dashboard',
                setting_value: updates.tutorials_enabled_dashboard ? '"true"' : '"false"'
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating tutorial settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
