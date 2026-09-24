import {NextRequest,NextResponse} from 'next/server';
import {revalidatePath} from 'next/cache';
import {createClient} from '@/lib/supabase/server';

export const dynamic='force-dynamic';
const uuid=(value:unknown):value is string=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const invalid=()=>NextResponse.json({error:'إعدادات المنتج غير صالحة. راجع الاختيارات وحاول مرة أخرى.'},{status:400});

export async function POST(request:NextRequest,{params}:{params:{storeId:string}}){
 if(!uuid(params.storeId))return invalid();
 const db=createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:'سجّل الدخول لحفظ إعدادات المنتج.'},{status:401});
 const {data:store,error:storeError}=await db.from('stores').select('id,slug').eq('id',params.storeId).eq('owner_id',user.id).maybeSingle();
 if(storeError||!store)return NextResponse.json({error:'لا تملك صلاحية تعديل منتجات هذا المتجر.'},{status:403});
 let body:any;
 try{const raw=await request.text();if(raw.length>50000)return invalid();body=JSON.parse(raw)}catch{return invalid()}
 if(!body||typeof body!=='object')return invalid();
 let result;
 if(body.operation==='visibility'){
  if(!Array.isArray(body.productIds)||body.productIds.length<1||body.productIds.length>200||!body.productIds.every(uuid)||new Set(body.productIds).size!==body.productIds.length||!['listed','unlisted'].includes(body.visibility))return invalid();
  result=await db.rpc('set_product_visibility_bulk',{p_store_id:store.id,p_product_ids:body.productIds,p_visibility:body.visibility});
 }else if(body.operation==='save'){
  if(!uuid(body.productId)||!Number.isInteger(body.revision)||body.revision<0||!['listed','unlisted'].includes(body.catalog_visibility)||!['auto','manual','off'].includes(body.mode)||![2,4,6,8].includes(body.display_limit)||!Array.isArray(body.recommendation_ids)||body.recommendation_ids.length>8||!body.recommendation_ids.every(uuid)||new Set(body.recommendation_ids).size!==body.recommendation_ids.length||body.recommendation_ids.includes(body.productId))return invalid();
  if(!body.title||typeof body.title!=='object'||Array.isArray(body.title)||['ar','en'].some(key=>body.title[key]!==undefined&&(typeof body.title[key]!=='string'||body.title[key].length>120)))return invalid();
  const {data:product,error}=await db.from('products').select('id').eq('id',body.productId).eq('store_id',store.id).maybeSingle();
  if(error||!product)return NextResponse.json({error:'المنتج غير موجود في هذا المتجر.'},{status:404});
  result=await db.rpc('save_product_merchandising',{p_product_id:body.productId,p_revision:body.revision,p_catalog_visibility:body.catalog_visibility,p_mode:body.mode,p_title:{ar:body.title.ar||'',en:body.title.en||''},p_display_limit:body.display_limit,p_recommendation_ids:body.recommendation_ids});
 }else return invalid();
 if(result.error){
  const conflict=result.error.code==='PT409'||/revision|conflict|changed|تعارض|تغيّر|تغير/i.test(result.error.message||'');
  return NextResponse.json({error:conflict?'تغيّرت إعدادات المنتج في جلسة أخرى. أعد تحميل الإعدادات قبل الحفظ.':result.error.code==='P0001'?result.error.message:'تعذر حفظ إعدادات المنتج. أعد المحاولة.',code:conflict?'revision_conflict':'save_failed'},{status:conflict?409:400});
 }
 // Storefront subdomains are rewritten to this shared route tree.
 revalidatePath(`/s/${store.slug}`,'layout');
 revalidatePath('/sitemap.xml');
 return NextResponse.json(result.data,{headers:{'Cache-Control':'no-store'}});
}
