import { validateCheckout, CheckoutErrors } from '@/lib/checkout-validation';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncOrderToGoogleSheets } from '@/lib/integrations/google-sheets-sync';
import { createNotification } from '@/lib/notifications';
export async function submitOrder(request: NextRequest, quick = false) {
 try {
  const body = await request.json();
  if (!/^[0-9a-f-]{36}$/i.test(body.request_key || '')) return NextResponse.json({error:'حدّث الصفحة ثم أعد المحاولة'}, {status:400});
  let cart = body.cart;
  if (quick) {
   if (!Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > 100) return NextResponse.json({error:'كمية غير صالحة'}, {status:400});
   cart = Array.from({length:body.quantity}, (_, i) => ({productId:body.product?.id,quantity:1,variants:Object.values(body.selections?.[i] || {}).map(optionId=>({optionId}))}));
  }
  if (!Array.isArray(cart) || !cart.length || cart.length > 100) return NextResponse.json({error:'السلة غير صالحة'}, {status:400});
  const db=createAdminClient();
  const {data:store,error:storeError}=await db.from('stores').select('settings').eq('id',body.store_id).maybeSingle();
  if(storeError || !store) return NextResponse.json({error:'تعذر العثور على المتجر. حدّث الصفحة وحاول مرة أخرى.'},{status:400});
  const checked=validateCheckout(body.formData,store.settings?.shipping,body.selectedGovernorate,body.language);
  if(Object.keys(checked.errors).length) return NextResponse.json({error:body.language==='en'?'Please correct the highlighted fields.':'صحّح الحقول الموضحة لإتمام الطلب.',fieldErrors:checked.errors},{status:400});
  const payload = {store_id:body.store_id,request_key:body.request_key,
   cart:cart.map((x:any)=>({productId:x.productId,quantity:x.quantity,variants:(x.variants||[]).map((v:any)=>({optionId:v.optionId}))})),
   formData:checked.data, selectedGovernorate:body.selectedGovernorate || null,couponCode:body.couponCode || null,
   affiliate_code:body.affiliate_code || null,paymentMethod:body.paymentMethod || 'cod',redeemPoints:!!body.redeemPoints,
   bumpOffer:body.bumpOffer?.selected ? {selected:true} : null};
  const {data,error}=await db.rpc('place_order_atomic',{payload});
  if(error){console.error('[Checkout]',error.code);return NextResponse.json({error:error.code==='P0001'?error.message:'تعذر حفظ الطلب؛ راجع البيانات وحاول مرة أخرى'}, {status:error.code==='P0001'||error.code?.startsWith('22')?400:503});}
  if (!data.replayed) {
   try {await createNotification(db,{store_id:body.store_id,title:'طلب جديد',message:`تم استلام الطلب ${data.order_number}`,type:'order',link:`/dashboard/${body.store_id}/orders`});}catch{console.error('Order notification pending');}
   try {await syncOrderToGoogleSheets(data.order_id,body.store_id);}catch{console.error('Order sync pending');}
  }
  return NextResponse.json(data);
 }catch{return NextResponse.json({error:'بيانات الطلب غير صالحة'}, {status:400});}
}
