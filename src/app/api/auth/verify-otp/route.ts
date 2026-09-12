import { NextRequest,NextResponse } from 'next/server';
import { verificationIdentity,verificationHash } from '@/lib/merchant-verification-server';
import { normalizePhone } from '@/lib/checkout-validation';
export async function POST(req:NextRequest){
 try{
  const identity=await verificationIdentity(req);if(!identity)return NextResponse.json({error:'سجل الدخول أولًا'},{status:401});
  const body=await req.json(),code=normalizePhone(body.code);
  if(!/^[0-9]{6}$/.test(code)||!String(body.challengeId||'').match(/^[0-9a-f-]{36}$/i))return NextResponse.json({error:'أدخل رمز التفعيل المكون من 6 أرقام'},{status:400});
  const {data,error}=await identity.db.rpc('consume_merchant_challenge',{p_user:identity.user.id,p_id:body.challengeId,p_hash:verificationHash(identity.user.id,body.challengeId,code)});
  if(error)return NextResponse.json({error:'تعذر التحقق من الرمز'},{status:503});
  return NextResponse.json(data?.success?data:{error:data?.error||'الرمز غير صالح',attemptsRemaining:data?.attemptsRemaining},{status:data?.success?200:400});
 }catch{return NextResponse.json({error:'تعذر التحقق من الرمز'},{status:400});}
}
