import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSessionToken } from '@/lib/admin-auth';
export const dynamic = 'force-dynamic';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Context = { params: { storeId: string } };
async function authorize(storeId: string) {
    const token = await getAdminSessionToken();
    if (!token) return null;
    const db = createAdminClient();
    const {data, error} = await db.rpc('validate_super_admin_session', {p_token:token});
    if (error || !data?.valid) return null;
    return db;
}
async function handle(req: NextRequest, {params}: Context) {
    const db = await authorize(params.storeId);
    if (!db) return NextResponse.json({error:'جلسة الإدارة غير صالحة؛ سجل الدخول مجددًا'}, {status:401});
    if (!uuid.test(params.storeId)) return NextResponse.json({error:'معرف المتجر غير صالح'}, {status:400});
    try {
        const {data:store,error:storeError}=await db.from('stores').select('id').eq('id',params.storeId).maybeSingle();
        if(storeError) throw storeError;
        if(!store) return NextResponse.json({error:'المتجر غير موجود'}, {status:404});
        if(req.method==='GET') {
            const [current, available] = await Promise.all([
                db.from('store_add_ons').select('*, add_on:add_ons(*)').eq('store_id',params.storeId),
                db.from('add_ons').select('*').eq('is_active',true)
            ]);
            if(current.error || available.error) throw current.error || available.error;
            return NextResponse.json({current:current.data,available:available.data},{headers:{'Cache-Control':'no-store'}});
        }
        const body = await req.json().catch(()=>null);
        if(req.method==='POST') {
            if(!uuid.test(body?.add_on_id || '')) return NextResponse.json({error:'اختر خدمة صحيحة'}, {status:400});
            const {data:addOn,error:lookupError}=await db.from('add_ons').select('id').eq('id',body.add_on_id).eq('is_active',true).maybeSingle();
            if(lookupError) throw lookupError;
            if(!addOn) return NextResponse.json({error:'الخدمة غير متاحة'}, {status:404});
            const {error}=await db.from('store_add_ons').upsert({store_id:params.storeId,add_on_id:addOn.id,status:'active'},{onConflict:'store_id,add_on_id'});
            if(error) throw error;
        } else {
            if(!uuid.test(body?.id || '')) return NextResponse.json({error:'معرف الخدمة غير صالح'}, {status:400});
            const {data,error}=await db.from('store_add_ons').delete().eq('store_id',params.storeId).eq('id',body.id).select('id');
            if(error) throw error;
            if(!data?.length) return NextResponse.json({error:'الخدمة غير موجودة في هذا المتجر'}, {status:404});
        }
        return NextResponse.json({success:true});
    } catch {
        return NextResponse.json({error:'تعذر حفظ أو تحميل الخدمات؛ حاول مرة أخرى'}, {status:500});
    }
}
export const GET = handle;
export const POST = handle;
export const DELETE = handle;
