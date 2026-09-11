import { NextRequest,NextResponse } from 'next/server';
import { requireStoreOwner } from '@/lib/store-owner-server';
import { normalizePhone } from '@/lib/checkout-validation';
export async function POST(req:NextRequest){
 try {
  const b=await req.json();const owner=await requireStoreOwner(req,b.store_id);
  if(!owner)return NextResponse.json({error:'سجل الدخول بحساب صاحب المتجر'},{status:401});
  const {data:quote}=await owner.db.from('wallet_recharge_quotes').select('id').eq('id',b.quote_id).eq('store_id',owner.store.id).eq('user_id',owner.user.id).maybeSingle();
  if(!quote)return NextResponse.json({error:'عرض الشحن لا يخص هذا المتجر'},{status:400});
  const phone=normalizePhone(b.sender_phone);
  if(!/^\+?[0-9]{8,15}$/.test(phone))return NextResponse.json({error:'رقم هاتف التحويل يجب أن يحتوي على 8 إلى 15 رقمًا'},{status:400});
  const path=String(b.proof_path||'');
  if(!path.startsWith(owner.store.id+'/')||path.includes('..')||path.split('/').length!==2)return NextResponse.json({error:'إثبات التحويل غير صالح'},{status:400});
  const {data:files,error:fileError}=await owner.db.storage.from('recharge-proofs').list(owner.store.id,{search:path.split('/')[1]});
  if(fileError||!files?.some(f=>f.name===path.split('/')[1]))return NextResponse.json({error:'ارفع إثبات التحويل أولًا'},{status:400});
  const {data:{publicUrl}}=owner.db.storage.from('recharge-proofs').getPublicUrl(path);
  const {data:id,error}=await owner.db.rpc('submit_recharge_quote',{p_quote:b.quote_id,p_user:owner.user.id,p_phone:phone,p_proof:publicUrl});
  if(error)return NextResponse.json({error:error.code==='P0001'?error.message:'تعذر حفظ طلب الشحن'},{status:400});
  return NextResponse.json({id,success:true});
 }catch{return NextResponse.json({error:'بيانات طلب الشحن غير صالحة'},{status:400});}
}
