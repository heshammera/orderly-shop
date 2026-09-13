import { variantUnitPrice } from '@/lib/variant-selection';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizePhone } from '@/lib/checkout-validation';
import { randomUUID } from 'crypto';
export async function POST(request:NextRequest,{params}:{params:{storeSlug:string}}){
 try{
  const body=await request.json();const name=String(body.customer_name||'').trim().slice(0,120),phone=normalizePhone(String(body.customer_phone||'')).slice(0,24);
  if(!name&&!phone)return NextResponse.json({error:'Contact information required'},{status:400});
  if(!Array.isArray(body.cart_items)||!body.cart_items.length||body.cart_items.length>100)return NextResponse.json({error:'Invalid items'},{status:400});
  const db=createAdminClient({noStore:true});const {data:store}=await db.from('stores').select('id').eq('slug',params.storeSlug).single();if(!store)return NextResponse.json({error:'Store not found'},{status:404});
  const ids=body.cart_items.map((i:any)=>String(i.productId||''));if(ids.some((id:string)=>!/^[0-9a-f-]{36}$/i.test(id)))return NextResponse.json({error:'Invalid product'},{status:400});
  const {data:products,error}=await db.from('products').select('id,name,price,sale_price,images').eq('store_id',store.id).in('id',ids);if(error||ids.some((id:string)=>!products?.some(p=>p.id===id)))return NextResponse.json({error:'Invalid product'},{status:400});
  const {data:groups,error:groupError}=await db.from('product_variants').select('id,product_id,name,variant_options(id,label,price,price_modifier)').in('product_id',ids);if(groupError)throw groupError;
  const items=body.cart_items.map((item:any)=>{
   const p=products!.find(p=>p.id===item.productId)!;const selected=Array.isArray(item.variants)?item.variants.slice(0,20):[];
   const choices=(groups||[]).filter(g=>g.product_id===p.id).flatMap(g=>{const o=g.variant_options.find(o=>selected.some((v:any)=>v.optionId===o.id));return o?[{...o,variantId:g.id,variantName:g.name,optionId:o.id,optionLabel:o.label}]:[];});
   return {productId:p.id,productName:p.name,productImage:Array.isArray(p.images)?p.images[0]:null,quantity:Math.max(1,Math.min(100,Math.floor(Number(item.quantity)||1))),unitPrice:variantUnitPrice(Number(p.sale_price)>0?Number(p.sale_price):Number(p.price),choices),variants:choices};
  });
  const total=items.reduce((sum:number,i:any)=>sum+i.unitPrice*i.quantity,0);
  const cookieName=`orderly_checkout_${store.id}`,existing=request.cookies.get(cookieName)?.value;
  const session=existing&&/^[0-9a-f-]{36}$/i.test(existing)?existing:randomUUID();
  const source=body.source==='product'?`product:${ids[0]}`:'cart';
  const {data:id,error:saved}=await db.rpc('save_checkout_draft',{p_store:store.id,p_session:session,p_source:source,p_name:name,p_phone:phone,p_items:items,p_total:total});if(saved)throw saved;
  const response=NextResponse.json({success:true,cartId:id});response.cookies.set(cookieName,session,{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:60*60*24*7});return response;
 }catch{return NextResponse.json({error:'Could not save checkout progress'},{status:503});}
}
