import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { createHmac } from 'crypto';
export async function verificationIdentity(req:NextRequest){
 const db=createAdminClient({noStore:true});const token=req.headers.get('authorization')?.replace(/^Bearer /i,'');
 const {data:{user}}=token?await db.auth.getUser(token):await createClient().auth.getUser();
 return user?{db,user}:null;
}
export function verificationHash(user:string,id:string,code:string){
 const key=process.env.MERCHANT_OTP_SECRET;if(!key)throw Error('Verification secret missing');
 return createHmac('sha256',key).update(`${user}:${id}:${code}`).digest('hex');
}
