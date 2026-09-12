import { contactErrors } from '@/lib/contact-validation';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, fullName, metadata } = body;

        if (!email || !password || !fullName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const contact=contactErrors(fullName,metadata?.phone,body.language);
        if(Object.keys(contact.errors).length)return NextResponse.json({error:Object.values(contact.errors).join(' '),fieldErrors:contact.errors},{status:400});
        const supabase = createAdminClient();

        // Check if user already exists

        // Instead of RPC which we haven't checked, let's just use admin.listUsers or rely on createUser to fail gracefully

        // Use Supabase Admin API to create the user bypassing the built-in email sending service 
        // (which is limited to 2/hour per project on the free tier)
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Permit sign-in; merchant access requires separately verified email OR phone.
            user_metadata: {
                store_name: metadata?.store_name,
                store_slug: metadata?.store_slug,
                referral_code: metadata?.referral_code,
                full_name: contact.name,
                phone: contact.phone,
            },
        });

        if (error) {
            console.error('[auth/register] Supabase admin error:', error);
            // Return appropriate error
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ user: data.user });
    } catch (error: any) {
        console.error('[auth/register] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
