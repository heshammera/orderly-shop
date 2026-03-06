import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { parseVideoUrl } from '@/lib/videoUtils';

// Get Tutorials
export async function GET(req: Request) {
    const url = new URL(req.url);
    const categoryFilter = url.searchParams.get('category');
    const statusFilter = url.searchParams.get('status');
    const isAdminMode = url.searchParams.get('admin') === 'true';

    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    try {
        let query = supabase
            .from('tutorials')
            .select(`
                *,
                category:category_id (id, name)
            `)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (categoryFilter && categoryFilter !== 'all') {
            query = query.eq('category_id', categoryFilter);
        }

        if (statusFilter === 'published' || !isAdminMode) {
            query = query.eq('is_published', true);
        } else if (statusFilter === 'draft') {
            query = query.eq('is_published', false);
        }

        // If not admin, we might need filtering based on display_mode depending on the route 
        // that calls this (e.g. landing vs standalone), handled on frontend for now.

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Create Tutorial
export async function POST(req: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { data: roleData } = await supabase.rpc('get_user_role', { user_id: user.id });
        if (roleData !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await req.json();

        // Auto-extract video IDs and thumbnails if not provided
        let { video_type, video_url, video_id, thumbnail_url } = body;

        if (video_url && video_type !== 'upload' && (!video_id || !thumbnail_url)) {
            const parsed = parseVideoUrl(video_url);
            if (!video_type) video_type = parsed.platform;
            if (!video_id && parsed.id) video_id = parsed.id;
            if (!thumbnail_url && parsed.thumbnailUrl) thumbnail_url = parsed.thumbnailUrl;
        }

        const newTutorial = {
            ...body,
            video_type,
            video_id,
            thumbnail_url
        };

        const { data, error } = await supabase
            .from('tutorials')
            .insert([newTutorial])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update Tutorial
export async function PUT(req: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { data: roleData } = await supabase.rpc('get_user_role', { user_id: user.id });
        if (roleData !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        // Auto-extract if URL changed
        if (updates.video_url && updates.video_type !== 'upload') {
            const parsed = parseVideoUrl(updates.video_url);
            updates.video_type = parsed.platform;
            if (!updates.video_id) updates.video_id = parsed.id;
            if (!updates.thumbnail_url) updates.thumbnail_url = parsed.thumbnailUrl;
        }

        const { data, error } = await supabase
            .from('tutorials')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Delete Tutorial
export async function DELETE(req: Request) {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { data: roleData } = await supabase.rpc('get_user_role', { user_id: user.id });
        if (roleData !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { error } = await supabase
            .from('tutorials')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
