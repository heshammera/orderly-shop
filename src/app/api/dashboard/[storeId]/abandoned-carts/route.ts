import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { storeId: string } }
) {
    try {
        const supabase = createClient();
        const { data: userAuth, error: authError } = await supabase.auth.getUser();

        if (authError || !userAuth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has context to this store
        // Add roles if needed, for now we let it pass the DB RLS which is safe

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status') || 'pending'; // 'pending', 'recovered', 'lost'

        const { data, error } = await supabase
            .from('abandoned_carts')
            .select(`
                id,
                store_id,
                customer_name,
                customer_phone,
                cart_items,
                total_price,
                recovery_status,
                created_at,
                updated_at
            `)
            .eq('store_id', params.storeId)
            .eq('recovery_status', status)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ carts: data });

    } catch (error: any) {
        console.error('Fetch abandoned carts error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { storeId: string } }
) {
    try {
        const supabase = createClient();
        const { data: userAuth, error: authError } = await supabase.auth.getUser();

        if (authError || !userAuth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, recovery_status } = body;

        if (!id || !recovery_status) {
            return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('abandoned_carts')
            .update({
                recovery_status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('store_id', params.storeId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ cart: data });

    } catch (error: any) {
        console.error('Update abandoned cart error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { storeId: string } }
) {
    try {
        const supabase = createClient();
        const { data: userAuth, error: authError } = await supabase.auth.getUser();

        if (authError || !userAuth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing cart id' }, { status: 400 });
        }

        const { error } = await supabase
            .from('abandoned_carts')
            .delete()
            .eq('id', id)
            .eq('store_id', params.storeId);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete abandoned cart error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
