import {NextResponse} from 'next/server';
import {createAdminClient} from '@/lib/supabase/admin';
export const dynamic='force-dynamic';
export const fetchCache='force-no-store';
export async function GET(_request:Request,{params}:{params:{storeSlug:string;productId:string}}){
 const headers={'Cache-Control':'no-store'};
 if(!/^[0-9a-f-]{36}$/i.test(params.productId))return NextResponse.json({products:[]},{status:400,headers});
 const db=createAdminClient({noStore:true});
 const {data:store}=await db.from('public_stores').select('id').eq('slug',params.storeSlug).maybeSingle();
 if(!store)return NextResponse.json({products:[]},{status:404,headers});
 const {data:product}=await db.from('public_products').select('id').eq('id',params.productId).eq('store_id',store.id).maybeSingle();
 if(!product)return NextResponse.json({products:[]},{status:404,headers});
 const {data,error}=await db.rpc('get_product_recommendations',{p_product_id:product.id});
 if(error)return NextResponse.json({products:[]},{status:503,headers});
 return NextResponse.json(data,{headers});
}
