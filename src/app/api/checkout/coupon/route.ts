import {NextRequest,NextResponse} from 'next/server';
import {createAdminClient} from '@/lib/supabase/admin';
export async function POST(req:NextRequest){try{
 const b=await req.json();const db=createAdminClient();
 const {data:c}=await db.from('coupons').select('id,code,discount_type,discount_value,min_order_amount,starts_at,expires_at,usage_limit,used_count,target_products,target_categories').eq('store_id',b.store_id).eq('code',b.code).eq('is_active',true).maybeSingle();
 if(!c||Date.parse(c.starts_at)>Date.now()||(c.expires_at&&Date.parse(c.expires_at)<Date.now())||(c.usage_limit!=null&&c.used_count>=c.usage_limit))return NextResponse.json({error:'الكوبون غير متاح'},{status:400});
 const ids=Array.isArray(b.cart)?b.cart.slice(0,100).map((x:any)=>x.productId):[];
 const {data:products}=await db.from('products').select('id,price,sale_price,product_categories(category_id)').eq('store_id',b.store_id).eq('status','active').in('id',ids);
 let amount=0;for(const x of b.cart||[]){const p=products?.find(p=>p.id===x.productId);if(!p||!Number.isInteger(x.quantity)||x.quantity<1||x.quantity>1000)throw Error();amount+=(p.sale_price>0?p.sale_price:p.price)*x.quantity;}
 if(amount<Number(c.min_order_amount||0))return NextResponse.json({error:'الطلب أقل من الحد الأدنى للكوبون'},{status:400});
 return NextResponse.json({coupon:c});
 }catch{return NextResponse.json({error:'بيانات الكوبون غير صالحة'},{status:400});}}
