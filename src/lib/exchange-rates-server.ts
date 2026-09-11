import { createAdminClient } from '@/lib/supabase/admin';
import { isSupportedCurrency } from '@/lib/currencies';
let pending: Promise<any> | null = null;
let lastFailure = 0;
const MAX_AGE = 48*60*60*1000;
export function validRateSnapshot(data:any, now=Date.now()) {
 const at=Date.parse(data?.provider_updated_at || '');
 return Number.isFinite(at) && at<=now+300000 && now-at<=MAX_AGE && data?.rates?.USD===1;
}
export async function getUsdRate(currency:string) {
 if(!isSupportedCurrency(currency)) throw new Error('العملة غير مدعومة');
 if(currency==='USD') return {rate:1,updatedAt:new Date().toISOString(),cached:false};
 const db=createAdminClient();
 const {data:cached}=await db.from('currency_rate_cache').select('*').eq('base','USD').maybeSingle();
 let snapshot=cached;
 let usedCache=true;
 if(!validRateSnapshot(cached) || Date.now()-Date.parse(cached?.fetched_at || '')>3600000) {
  try {
   if(Date.now()-lastFailure<60000) throw new Error('Provider temporarily unavailable');
   if(!pending) pending=(async()=>{
    const response=await fetch('https://open.er-api.com/v6/latest/USD',{cache:'no-store',signal:AbortSignal.timeout(8000)});
    if(!response.ok) throw new Error('Rate provider unavailable');
    const raw=await response.json();
    const row={base:'USD',rates:raw.rates,provider_updated_at:new Date(raw.time_last_update_unix*1000).toISOString(),fetched_at:new Date().toISOString()};
    if(raw.result!=='success' || raw.base_code!=='USD' || !validRateSnapshot(row)) throw new Error('Invalid rate snapshot');
    for(const rate of Object.values(row.rates)) if(typeof rate!=='number' || !Number.isFinite(rate) || rate<=0) throw new Error('Invalid exchange rate');
    const {error}=await db.from('currency_rate_cache').upsert(row);
    if(error) throw new Error('Unable to save exchange rate');
    return row;
   })().finally(()=>{pending=null;});
   snapshot=await pending;usedCache=false;
  }catch {lastFailure=Date.now();if(!validRateSnapshot(cached)) throw new Error('سعر الصرف غير متاح حاليًا؛ حاول لاحقًا. لم يتم احتساب أي مبلغ بديل.');}
 }
 const rate=Number(snapshot?.rates?.[currency]);
 if(!Number.isFinite(rate)||rate<=0) throw new Error('سعر صرف هذه العملة غير متاح حاليًا');
 await db.rpc('settle_pending_order_commissions');
 return {rate,updatedAt:snapshot.provider_updated_at,cached:usedCache};
}
