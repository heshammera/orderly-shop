import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Get tutorial settings
export async function GET() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: roleData } = await supabase.rpc('get_user_role', { user_id: user.id });
        if (roleData !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch settings
        const { data: landingSetting } = await supabase.rpc('get_setting', { setting_key: 'tutorials_enabled_landing' });
        const { data: dashboardSetting } = await supabase.rpc('get_setting', { setting_key: 'tutorials_enabled_dashboard' });

        return NextResponse.json({
            tutorials_enabled_landing: landingSetting === 'true' || landingSetting === true,
            tutorials_enabled_dashboard: dashboardSetting === 'true' || dashboardSetting === true,
        });
    } catch (error: any) {
        console.error('Error fetching tutorial settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update settings
export async function PATCH(req: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: roleData } = await supabase.rpc('get_user_role', { user_id: user.id });
        if (roleData !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

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
