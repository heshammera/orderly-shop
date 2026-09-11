import { NextRequest,NextResponse } from 'next/server';
import { getAdminSessionToken } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupportedCurrency } from '@/lib/currencies';
async function authorize(){const token=await getAdminSessionToken();if(!token)return null;const db=createAdminClient();const {data,error}=await db.rpc('validate_super_admin_session',{p_token:token});return !error&&data?.valid?db:null;}
export async function GET(req:NextRequest){
 const db=await authorize();if(!db)return NextResponse.json({error:'جلسة الإدارة غير صالحة'},{status:401});
 if(req.nextUrl.searchParams.get('settings')==='1'){const {data,error}=await db.rpc('get_setting',{setting_key:'payment_wallets'});return NextResponse.json(error?{error:'تعذر تحميل المحافظ'}:{wallets:data?.wallets||[]},{status:error?500:200});}
 let query=db.from('wallet_recharge_requests').select('*,store:stores(name,currency)').order('created_at',{ascending:false}).limit(200);
 const status=req.nextUrl.searchParams.get('status');if(status&&status!=='all')query=query.eq('status',status);
 const {data,error}=await query;return NextResponse.json(error?{error:'تعذر تحميل الطلبات'}:{requests:data},{status:error?500:200});
}
export async function POST(req:NextRequest){
 const db=await authorize();if(!db)return NextResponse.json({error:'جلسة الإدارة غير صالحة'},{status:401});
 try{
  const b=await req.json();let error:any;
  if(b.action==='settings'){
   if(!Array.isArray(b.wallets)||b.wallets.some((w:any)=>!w.id||!w.number||!isSupportedCurrency(w.currency)))return NextResponse.json({error:'حدد عملة صحيحة ورقمًا لكل محفظة'},{status:400});
   ({error}=await db.rpc('set_setting',{setting_key:'payment_wallets',setting_value:{wallets:b.wallets},setting_description:'Receiving wallets and their payment currencies'}));
  }else if(b.action==='approve'){({error}=await db.rpc('approve_recharge_request',{request_id:b.id}));}
  else if(b.action==='reject'){({error}=await db.from('wallet_recharge_requests').update({status:'rejected',rejection_reason:String(b.reason||'').slice(0,1000)}).eq('id',b.id).eq('status','pending'));}
  else if(b.action==='manual'){
   const usd=Number(b.amount_usd);if(!Number.isFinite(usd)||usd<=0||usd>100000||!['add','deduct'].includes(b.type))return NextResponse.json({error:'المبلغ أو نوع العملية غير صالح'},{status:400});
   ({error}=await db.rpc('admin_recharge_wallet',{p_store_id:b.store_id,p_amount:b.type==='deduct'?-usd:usd,p_type:b.type==='deduct'?'withdrawal':'deposit',p_description:`Manual ${b.type} by platform admin: ${usd} USD`}));
  }else return NextResponse.json({error:'عملية غير صالحة'},{status:400});
  if(error)return NextResponse.json({error:error.code==='P0001'?error.message:'تعذرت العملية'},{status:400});
  return NextResponse.json({success:true});
 }catch{return NextResponse.json({error:'تعذرت العملية'},{status:400});}
}
