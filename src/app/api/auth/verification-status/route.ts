import { NextRequest,NextResponse } from 'next/server';
import { verificationIdentity } from '@/lib/merchant-verification-server';
import { normalizePhone } from '@/lib/checkout-validation';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
 const identity=await verificationIdentity(req);if(!identity)return NextResponse.json({error:'سجل الدخول أولًا'},{status:401});
 const {db,user}=identity;
 const [{data:profile},{data:contact},{data:verified,error}]=await Promise.all([
  db.from('profiles').select('phone').eq('user_id',user.id).maybeSingle(),
  db.from('merchant_contact_verifications').select('verified_email,email_verified_at,verified_phone,phone_verified_at').eq('user_id',user.id).maybeSingle(),
  db.rpc('merchant_is_verified',{p_user:user.id})]);
 if(error)return NextResponse.json({error:'تعذر تحميل حالة التفعيل'},{status:503});
 const phone=normalizePhone(profile?.phone);
 return NextResponse.json({verified:!!verified,email:user.email,phone,emailVerified:!!contact?.email_verified_at&&contact.verified_email===user.email?.toLowerCase(),phoneVerified:!!contact?.phone_verified_at&&contact.verified_phone===phone,emailAvailable:process.env.AUTH_DELIVERY_ENABLED==='true',whatsappAvailable:process.env.WHATSAPP_VERIFICATION_ENABLED==='true'&&!!process.env.N8N_WHATSAPP_WEBHOOK_URL},{headers:{'Cache-Control':'no-store'}});
}
