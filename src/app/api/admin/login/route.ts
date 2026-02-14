import { createAdminClient } from '@/lib/supabase/admin'
import { setAdminSession } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const { email, password } = body;

        console.log('[Admin Login] Attempting login for:', email);

        if (!email || !password) {
            console.warn('[Admin Login] Missing email or password');
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Check environment variable
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('[Admin Login] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing');
            return NextResponse.json(
                { message: 'Server configuration error: Missing Service Role Key' },
                { status: 500 }
            );
        }

        const supabase = createAdminClient()

        console.log('[Admin Login] Calling RPC login_super_admin...');
        const { data, error } = await supabase.rpc('login_super_admin', {
            p_email: email,
            p_password: password,
            p_user_agent: request.headers.get('user-agent') || undefined,
            p_ip_address: request.headers.get('x-forwarded-for') || undefined,
        })

        if (error) {
            console.error('[Admin Login] RPC Error:', JSON.stringify(error, null, 2));
            return NextResponse.json(
                { message: `Database Error: ${error.message} (Hint: Did you run the migration?)` },
                { status: 500 }
            )
        }

        console.log('[Admin Login] RPC Success, Result:', data);

        if (!data || !data.success) {
            console.warn('[Admin Login] Failed login logic:', data?.message);
            return NextResponse.json(
                { message: data?.message || 'Invalid credentials' },
                { status: 401 }
            )
        }

        // Set HTTP-only cookie
        await setAdminSession(data.token, data.expires_at)

        return NextResponse.json({ success: true, redirect: '/admin' })
    } catch (error: any) {
        console.error('Admin login error:', error)
        return NextResponse.json(
            { message: `Internal server error: ${error.message}` },
            { status: 500 }
        )
    }
}
