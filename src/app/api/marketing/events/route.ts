import {NextRequest,NextResponse} from 'next/server';import {createAdminClient} from '@/lib/supabase/admin';
const allowed=new Set(['homepage_view','signup_click','demo_click','theme_preview','plan_select','signup_start']);const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;const buckets=new Map<string,{count:number;until:number}>();
export async function POST(req:NextRequest){
 try{const origin=req.headers.get('origin');if(!origin||new URL(origin).host!==req.headers.get('host'))return new NextResponse(null,{status:403});
 const originHost=new URL(origin).hostname;if(!['orderlyshops.com','www.orderlyshops.com','localhost','127.0.0.1'].includes(originHost))return new NextResponse(null,{status:403});
 const key=(req.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim();const now=Date.now();const previous=buckets.get(key);if(previous&&previous.until>now&&previous.count>=60)return new NextResponse(null,{status:429});if(buckets.size>10000)buckets.delete(buckets.keys().next().value!);buckets.set(key,previous&&previous.until>now?{count:previous.count+1,until:previous.until}:{count:1,until:now+60000});
 if(Number(req.headers.get('content-length')||0)>1024)return new NextResponse(null,{status:413});const reader=req.body?.getReader();if(!reader)return new NextResponse(null,{status:400});let raw='',bytes=0;const decoder=new TextDecoder();while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>1024){await reader.cancel();return new NextResponse(null,{status:413})}raw+=decoder.decode(part.value,{stream:true})}raw+=decoder.decode();const body=JSON.parse(raw);
 if(!uuid.test(body.id)||!uuid.test(body.session_id)||!allowed.has(body.event_name)||!['mobile','desktop'].includes(body.device))return new NextResponse(null,{status:400});
 const {error}=await createAdminClient().from('marketing_events').insert({id:body.id,session_id:body.session_id,event_name:body.event_name,device:body.device});if(error&&error.code!=='23505')return new NextResponse(null,{status:503});return new NextResponse(null,{status:204});
 }catch{return new NextResponse(null,{status:400})}
}
