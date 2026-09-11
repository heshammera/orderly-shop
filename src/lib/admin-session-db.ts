import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSessionToken } from '@/lib/admin-auth';
export async function authorizedAdminDb(){
 const token=await getAdminSessionToken();if(!token)return null;
 const db=createAdminClient();const {data,error}=await db.rpc('validate_super_admin_session',{p_token:token});
 return !error&&data?.valid?db:null;
}
