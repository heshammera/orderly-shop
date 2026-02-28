import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');

        if (!storeId) {
            return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
        }

        // 1. Verify Super Admin Session
        const adminToken = request.cookies.get('admin_session_token')?.value;
        if (!adminToken) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        const supabaseAdmin = createAdminClient();

        // 2. Validate token against the database (similar to middleware)
        const { data: isValid, error: validationError } = await supabaseAdmin.rpc('validate_super_admin_session', {
            p_token: adminToken
        });

        if (validationError || !isValid) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        // 3. Find Store Owner ID
        const { data: store, error: storeError } = await supabaseAdmin
            .from('stores')
            .select('owner_id')
            .eq('id', storeId)
            .single();

        if (storeError || !store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        // 4. Get Owner Email from auth.users using Admin API
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(store.owner_id);

        if (userError || !userData?.user?.email) {
            return NextResponse.json({ error: 'Store owner email not found' }, { status: 404 });
        }

        // 5. Generate a Magic Link for the owner
        const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const actualOrigin = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

        const redirectUrl = `${actualOrigin}/auth/callback?next=/dashboard/${storeId}&impersonate=true`;

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: userData.user.email,
            options: {
                redirectTo: redirectUrl
            }
        });

        if (linkError || !linkData?.properties?.action_link) {
            console.error('Error generating impersonation link:', linkError);
            return NextResponse.json({ error: 'Failed to generate impersonation link' }, { status: 500 });
        }

        // 6. Intercept the action_link to bypass Supabase URL Whitelist restrictions
        // We manually fetch the redirect link server-side to consume the token
        // and get the resulting Location header which contains the #access_token
        const verifyRes = await fetch(linkData.properties.action_link, {
            method: 'GET',
            redirect: 'manual'
        });

        const location = verifyRes.headers.get('Location');

        if (location) {
            // location contains the #access_token fragment, but the domain might be localhost:3000
            // due to Supabase fallback. We force the correct origin and path.
            const parsedLocation = new URL(location);

            const finalUrl = new URL('/auth/auth-code-error', actualOrigin);
            finalUrl.hash = parsedLocation.hash; // Preserve the #access_token=... fragment
            finalUrl.search = parsedLocation.search; // Preserve any errors in query

            return NextResponse.redirect(finalUrl.toString());
        }

        // Fallback if no location header found
        return NextResponse.redirect(linkData.properties.action_link);

    } catch (error) {
        console.error('Impersonation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
