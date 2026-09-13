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
        const status=searchParams.get('status')||'all';
        const days=Number(searchParams.get('days')||30),page=Number(searchParams.get('page')||1);
        if(![7,30,90].includes(days)||!Number.isInteger(page)||page<1||!['all','pending','live','recovered','lost'].includes(status))return NextResponse.json({error:'Invalid filters'},{status:400});
        const since=new Date(Date.now()-days*86400000).toISOString(),cutoff=new Date(Date.now()-30*60000).toISOString();
        const {data:store}=await supabase.from('stores').select('id,currency').eq('id',params.storeId).maybeSingle();
        if(!store)return NextResponse.json({error:'Forbidden'},{status:403});
        let query=supabase.from('abandoned_carts').select('id,customer_name,customer_phone,cart_items,total_price,recovery_status,created_at,last_activity_at,recovered_order_id,source_key,contacted_at',{count:'exact'})
          .eq('store_id',params.storeId).gte('created_at',since);
        if(status==='pending')query=query.eq('recovery_status','pending').lt('last_activity_at',cutoff);
        else if(status==='live')query=query.eq('recovery_status','pending').gte('last_activity_at',cutoff);
        else if(status!=='all')query=query.eq('recovery_status',status);
        const search=(searchParams.get('search')||'').slice(0,80).replace(/[,().%*\\]/g,'');
        if(search)query=query.or(`customer_name.ilike.*${search}*,customer_phone.ilike.*${search}*`);
        const [rows,stats]=await Promise.all([query.order('last_activity_at',{ascending:false}).range((page-1)*20,page*20-1),supabase.rpc('checkout_draft_stats',{p_store:params.storeId,p_since:since})]);
        if(rows.error||stats.error)throw Error('Could not load checkout progress');
        return NextResponse.json({carts:rows.data,total:rows.count,stats:stats.data,currency:store.currency},{headers:{'Cache-Control':'no-store'}});

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
        const { id, recovery_status, contacted } = body;

        if (!/^[0-9a-f-]{36}$/i.test(id||'') || (!contacted && !['pending','lost'].includes(recovery_status))) {
            return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('abandoned_carts')
            .update({
                ...(contacted ? {contacted_at:new Date().toISOString()} : {recovery_status}),
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
