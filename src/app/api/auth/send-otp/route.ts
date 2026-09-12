import { NextRequest,NextResponse } from 'next/server';
import { verificationIdentity,verificationHash } from '@/lib/merchant-verification-server';
import { normalizePhone } from '@/lib/checkout-validation';
import { randomInt,randomUUID } from 'crypto';
export async function POST(req:NextRequest){
 try{
  const identity=await verificationIdentity(req);if(!identity)return NextResponse.json({error:'سجل الدخول أولًا'},{status:401});
  const {db,user}=identity;const {method}=await req.json();
  if(!['email','whatsapp'].includes(method))return NextResponse.json({error:'اختر البريد أو واتساب'},{status:400});
  if(method==='whatsapp'&&(process.env.WHATSAPP_VERIFICATION_ENABLED!=='true'||!process.env.N8N_WHATSAPP_WEBHOOK_URL))return NextResponse.json({error:'واتساب غير متاح حاليًا. يمكنك تفعيل الحساب بالبريد الإلكتروني.'},{status:503});
  if(method==='email'&&process.env.AUTH_DELIVERY_ENABLED!=='true')return NextResponse.json({error:'خدمة البريد غير متاحة مؤقتًا'},{status:503});
  const {data:profile}=await db.from('profiles').select('phone').eq('user_id',user.id).maybeSingle();
  const destination=method==='email'?user.email?.toLowerCase():normalizePhone(profile?.phone);
  if(!destination || (method==='whatsapp'&&!/^\+[1-9][0-9]{7,14}$/.test(destination)))return NextResponse.json({error:'يلزم تسجيل رقم الهاتف مع رمز الدولة، مثل +201012345678'},{status:400});
  const id=randomUUID(),code=String(randomInt(100000,1000000));
  const {data:issued,error}=await db.rpc('issue_merchant_challenge',{p_user:user.id,p_id:id,p_method:method,p_destination:destination,p_hash:verificationHash(user.id,id,code)});
  if(error)return NextResponse.json({error:'تعذر إنشاء رمز التفعيل'},{status:503});
  if(!issued?.success)return NextResponse.json({error:issued?.error||'تعذر إنشاء الرمز'},{status:429});
  try{
   const payload=method==='email'?{kind:'merchant_verification',to:destination,subject:'رمز تفعيل حساب التاجر — أوردرلي',text:`رمز تفعيل حسابك هو: ${code}\nصالح لمدة 10 دقائق. لا تشارك الرمز مع أي شخص. إذا لم تطلبه، تجاهل هذه الرسالة.`}:{kind:'merchant_verification',to:destination,code,expiresIn:10};
   const response=await fetch((method==='email'?process.env.N8N_AUTH_WEBHOOK_URL:process.env.N8N_WHATSAPP_WEBHOOK_URL)!,{method:'POST',headers:{'Content-Type':'application/json','X-Orderly-Token':process.env.N8N_AUTH_WEBHOOK_TOKEN!},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
   const result=await response.json();
   if(!response.ok||result.error||result.success===false||(method==='email'&&!result.accepted?.some((x:string)=>x.toLowerCase()===destination)))throw Error('Delivery failed');
   const {error:saved}=await db.from('merchant_verification_challenges').update({delivery_state:'sent'}).eq('id',id);if(saved)throw saved;
  }catch{await db.from('merchant_verification_challenges').update({delivery_state:'failed'}).eq('id',id);return NextResponse.json({error:'تعذر إرسال الرمز؛ انتظر دقيقة وحاول مجددًا.'},{status:503});}
  return NextResponse.json({success:true,challengeId:id,expiresIn:600,retryAfter:60});
 }catch{return NextResponse.json({error:'تعذر إرسال رمز التفعيل'},{status:503});}
}
