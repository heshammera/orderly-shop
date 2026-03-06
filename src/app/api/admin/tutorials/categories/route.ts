import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSessionToken } from '@/lib/admin-auth';

// Get Categories
export async function GET(req: Request) {
    try {
        const token = await getAdminSessionToken();
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabase = createAdminClient();
        const { data: validation, error: valError } = await supabase.rpc('validate_super_admin_session', { p_token: token });
        if (valError || !validation?.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data, error } = await supabase
            .from('tutorial_categories')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Create Category
export async function POST(req: Request) {
    try {
        const token = await getAdminSessionToken();
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabase = createAdminClient();
        const { data: validation, error: valError } = await supabase.rpc('validate_super_admin_session', { p_token: token });
        if (valError || !validation?.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { name, slug, sort_order, icon } = body;

        const { data, error } = await supabase
            .from('tutorial_categories')
            .insert([{ name, slug, sort_order: sort_order || 0, icon }])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update Category
export async function PUT(req: Request) {
    try {
        const token = await getAdminSessionToken();
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabase = createAdminClient();
        const { data: validation, error: valError } = await supabase.rpc('validate_super_admin_session', { p_token: token });
        if (valError || !validation?.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { id, name, slug, sort_order, icon } = body;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const { data, error } = await supabase
            .from('tutorial_categories')
            .update({ name, slug, sort_order, icon })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Delete Category
export async function DELETE(req: Request) {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    try {
        const token = await getAdminSessionToken();
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabase = createAdminClient();
        const { data: validation, error: valError } = await supabase.rpc('validate_super_admin_session', { p_token: token });
        if (valError || !validation?.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { error } = await supabase
            .from('tutorial_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
