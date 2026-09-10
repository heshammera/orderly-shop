import {NextRequest,NextResponse} from 'next/server';
import {createAdminClient} from '@/lib/supabase/admin';
export async function POST(req:NextRequest){
 if(process.env.AUTH_DELIVERY_ENABLED!=='true'||!process.env.N8N_AUTH_WEBHOOK_URL||!process.env.N8N_AUTH_WEBHOOK_TOKEN)return NextResponse.json({error:'خدمة البريد قيد الإعداد؛ تواصل مع إدارة المنصة لاستعادة الحساب.'},{status:503});
 try{const {email}=await req.json();if(typeof email!=='string'||email.length>254||!email.includes('@'))return NextResponse.json({error:'أدخل بريدًا صحيحًا'},{status:400});
 const {data,error}=await createAdminClient().auth.admin.generateLink({type:'recovery',email,options:{redirectTo:'https://orderlyshops.com/reset-password'}});
 if(!error&&data?.properties?.action_link){const response=await fetch(process.env.N8N_AUTH_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json','X-Orderly-Token':process.env.N8N_AUTH_WEBHOOK_TOKEN},body:JSON.stringify({kind:'password_reset',to:email,subject:'استعادة كلمة مرور أوردرلي',text:'افتح الرابط لاستعادة كلمة المرور: '+data.properties.action_link}),signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('delivery');}
 return NextResponse.json({message:'إذا كان البريد مسجلًا، سيصلك رابط استعادة كلمة المرور.'});
 }catch{return NextResponse.json({error:'تعذر إرسال الرسالة الآن؛ حاول لاحقًا.'},{status:503});}}
