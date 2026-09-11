import { NextRequest,NextResponse } from 'next/server';
import { requireStoreOwner } from '@/lib/store-owner-server';
import { getUsdRate } from '@/lib/exchange-rates-server';
import { currencyDecimals,isSupportedCurrency } from '@/lib/currencies';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
 try {
  const body=await req.json();const owner=await requireStoreOwner(req,body.store_id);
  if(!owner)return NextResponse.json({error:'سجل الدخول بحساب صاحب المتجر'},{status:401});
  const amount=Number(body.amount_usd);
  if(!Number.isFinite(amount)||amount<5||amount>100000||Math.abs(amount*100-Math.round(amount*100))>0.00001)return NextResponse.json({error:'اكتب مبلغًا من 5 إلى 100000 دولار، بمنزلتين عشريتين كحد أقصى'},{status:400});
  const {data:settings,error}=await owner.db.rpc('get_setting',{setting_key:'payment_wallets'});
  if(error)throw error;
  const wallets=(settings?.wallets||[]).filter((w:any)=>w.active&&isSupportedCurrency(w.currency));
  const wallet=wallets.find((w:any)=>String(w.id)===String(body.wallet_id)) || (!body.wallet_id?wallets[0]:null);
  if(!wallet)return NextResponse.json({error:'لا توجد محفظة دفع نشطة بعملة محددة. تواصل مع الدعم.'},{status:400});
  const rate=await getUsdRate(wallet.currency);
  const lockedRate=Number(rate.rate.toFixed(8));
  const local=Number((amount*lockedRate).toFixed(currencyDecimals(wallet.currency)));
  const {data:quote,error:saveError}=await owner.db.from('wallet_recharge_quotes').insert({store_id:body.store_id,user_id:owner.user.id,amount_usd:amount,payment_currency:wallet.currency,amount_local:local,exchange_rate:lockedRate,rate_updated_at:rate.updatedAt,wallet_id:String(wallet.id),wallet_snapshot:wallet}).select('*').single();
  if(saveError)throw saveError;
  return NextResponse.json({quote,wallets},{headers:{'Cache-Control':'no-store'}});
 }catch(e:any){return NextResponse.json({error:e.message?.includes('سعر')?e.message:'تعذر تثبيت سعر الشحن؛ حاول مرة أخرى قبل التحويل.'},{status:503});}
}
