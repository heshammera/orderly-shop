import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
export async function requireStoreOwner(req:NextRequest,storeId:string){
 const db=createAdminClient();
 const bearer=req.headers.get('authorization')?.replace(/^Bearer /i,'');
 const {data:{user}}=bearer?await db.auth.getUser(bearer):await createClient().auth.getUser();
 if(!user)return null;
 const {data:store}=await db.from('stores').select('id,owner_id,currency').eq('id',storeId).eq('owner_id',user.id).maybeSingle();
 return store?{db,user,store}:null;
}
