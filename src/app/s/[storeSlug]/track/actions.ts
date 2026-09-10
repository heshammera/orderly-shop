"use server";
import { createAdminClient } from '@/lib/supabase/admin';
export async function trackOrder(storeSlug:string, orderNumber:string, phone:string=''){
 const normalized=phone.replace(/[^0-9+]/g,'');
 if(!/^ORD-[A-Z0-9-]{6,50}$/i.test(orderNumber.trim())||!/^\+?\d{8,15}$/.test(normalized))return {error:'أدخل رقم الطلب كاملًا ورقم الهاتف المستخدم في الطلب'};
 const db=createAdminClient();const {data:store}=await db.from('stores').select('id,currency').eq('slug',storeSlug).maybeSingle();
 if(!store)return {error:'لم يتم العثور على الطلب'};
 const {data,error}=await db.from('orders').select('order_number,created_at,status,total,order_items(quantity,unit_price,product_snapshot)').eq('store_id',store.id).eq('order_number',orderNumber.trim().toUpperCase()).eq('customer_snapshot->>phone',normalized).maybeSingle();
 return error||!data?{error:'لم يتم العثور على طلب مطابق'}:{success:true,orders:[data],currency:store.currency};
}
