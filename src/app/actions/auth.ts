"use server";
import { createAdminClient } from '@/lib/supabase/admin';
export async function checkEmailExists(email:string){
 if(!email || email.length>254)return {exists:false,error:'Invalid email'};
 const {data,error}=await createAdminClient().rpc('check_email_exists',{p_email:email});
 return error?{exists:false,error:'Server check failed'}:{exists:!!data};
}
