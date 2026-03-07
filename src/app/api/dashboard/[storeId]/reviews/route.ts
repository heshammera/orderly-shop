import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

// Helper to verify the user session
async function verifySession() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
            },
        }
    );
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

export async function GET(
    request: NextRequest,
    { params }: { params: { storeId: string } }
) {
    try {
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'pending';

        // Use admin client to bypass RLS — auth is already verified above
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('product_reviews')
            .select(`
                *,
                product:product_id (name, images)
            `)
            .eq('store_id', params.storeId)
            .eq('status', status)
            .order('created_at', { ascending: false });


        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ reviews: data || [] });

    } catch (error: any) {
        console.error('Fetch dashboard reviews API error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { storeId: string } }
) {
    try {
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { reviewId, status } = body;

        if (!reviewId || !['approved', 'rejected', 'pending'].includes(status)) {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        // Use admin client to bypass RLS — auth is already verified above
        const supabase = createAdminClient();

        const { error } = await supabase
            .from('product_reviews')
            .update({ status })
            .eq('id', reviewId)
            .eq('store_id', params.storeId);

        if (error) {
            console.error('Update review error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, status });

    } catch (error: any) {
        console.error('Update dashboard review API error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { storeId: string } }
) {
    try {
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const reviewId = searchParams.get('reviewId');

        if (!reviewId) {
            return NextResponse.json({ error: 'Missing reviewId' }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { error } = await supabase
            .from('product_reviews')
            .delete()
            .eq('id', reviewId)
            .eq('store_id', params.storeId);

        if (error) {
            console.error('Delete review error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete dashboard review API error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
