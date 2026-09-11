"use client";
import { useState,useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogTrigger } from '@/components/ui/dialog';
import { RateAttribution } from './RateAttribution';
interface Props {storeId:string;storeCurrency:string;presetUsdAmount?:number;onSuccess?:()=>void;isOpen?:boolean;onOpenChange?:(open:boolean)=>void;showTrigger?:boolean;}
export function WalletRechargeDialog({storeId,presetUsdAmount,onSuccess,isOpen,onOpenChange,showTrigger=true}:Props){
 const {language}=useLanguage();const {toast}=useToast();const ar=language==='ar';const supabase=createClient();
 const [internalOpen,setInternalOpen]=useState(false);const open=isOpen??internalOpen;
 const [amount,setAmount]=useState(presetUsdAmount||5);const [quote,setQuote]=useState<any>(null);const [wallets,setWallets]=useState<any[]>([]);const [walletId,setWalletId]=useState('');
 const [phone,setPhone]=useState('');const [proof,setProof]=useState<File|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 useEffect(()=>{if(open){setAmount(presetUsdAmount||5);setQuote(null);setError('');}},[open,presetUsdAmount,storeId]);
 const changeOpen=(value:boolean)=>{setInternalOpen(value);onOpenChange?.(value);if(value){setAmount(presetUsdAmount||5);setQuote(null);setError('');}};
 const headers=async()=>{const {data:{session}}=await supabase.auth.getSession();return {'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token||''}`};};
 const calculate=async()=>{
  setBusy(true);setError('');setQuote(null);
  try{const res=await fetch('/api/wallet/quote',{method:'POST',headers:await headers(),body:JSON.stringify({store_id:storeId,amount_usd:amount,wallet_id:walletId||undefined})});const data=await res.json();if(!res.ok)throw new Error(data.error);setQuote(data.quote);setWallets(data.wallets);setWalletId(data.quote.wallet_id);}
  catch(e:any){setError(e.message);}finally{setBusy(false);}
 };
 const submit=async()=>{
  if(!quote||!proof){setError(ar?'احسب مبلغ التحويل وارفع صورة الإثبات أولًا':'Calculate the payment and upload proof first.');return;}
  if(Date.parse(quote.expires_at)<Date.now()){setError(ar?'انتهت صلاحية المبلغ. تواصل مع الدعم إن كنت قد حولت بالفعل؛ وإلا احسب مبلغًا جديدًا قبل التحويل.':'Quote expired. Contact support if you already paid; otherwise request a new quote before paying.');return;}
  setBusy(true);setError('');
  try{
   if(!proof.type.startsWith('image/')||proof.size>10*1024*1024)throw new Error(ar?'ارفع صورة بحجم لا يتجاوز 10 ميجابايت':'Upload an image up to 10 MB.');
   const path=`${storeId}/${crypto.randomUUID()}.${proof.name.split('.').pop()}`;
   const {error:uploadError}=await supabase.storage.from('recharge-proofs').upload(path,proof);if(uploadError)throw uploadError;
   const res=await fetch('/api/wallet/recharge',{method:'POST',headers:await headers(),body:JSON.stringify({store_id:storeId,quote_id:quote.id,sender_phone:phone,proof_path:path})});const data=await res.json();if(!res.ok)throw new Error(data.error);
   toast({title:ar?'تم إرسال طلب الشحن للمراجعة':'Recharge submitted for review'});changeOpen(false);setQuote(null);setPhone('');setProof(null);onSuccess?.();
  }catch(e:any){setError(e.message);}finally{setBusy(false);}
 };
 return <Dialog open={open} onOpenChange={changeOpen}>
  {showTrigger&&<DialogTrigger asChild><Button>{ar?'شحن المحفظة':'Recharge wallet'}</Button></DialogTrigger>}
  <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
   <DialogHeader><DialogTitle>{ar?'شحن رصيد المحفظة بالدولار':'Recharge USD wallet'}</DialogTitle><DialogDescription>{ar?'عملة الدفع تتبع محفظة الاستقبال، وليست عملة متجرك.':'Payment currency belongs to the receiving wallet, independently of your store currency.'}</DialogDescription></DialogHeader>
   <div className="space-y-4">
    <Label htmlFor="recharge-usd">{ar?'الرصيد المطلوب بالدولار (5 دولار كحد أدنى)':'USD credit (minimum $5)'}</Label>
    <Input id="recharge-usd" type="number" min={5} max={100000} step="0.01" value={amount} disabled={busy||!!presetUsdAmount} onChange={e=>{setAmount(Number(e.target.value));setQuote(null);}}/>
    {wallets.length>1&&<div><Label htmlFor="receiving-wallet">{ar?'محفظة الاستقبال':'Receiving wallet'}</Label><select id="receiving-wallet" className="w-full border rounded-md p-2" value={walletId} disabled={busy} onChange={e=>{setWalletId(e.target.value);setQuote(null);}}>{wallets.map(w=><option key={w.id} value={w.id}>{w.name_ar||w.name} — {w.currency}</option>)}</select></div>}
    {!quote&&<Button className="w-full" onClick={calculate} disabled={busy}>{busy?(ar?'جارٍ جلب السعر…':'Loading…'):(ar?'احسب مبلغ التحويل':'Calculate payment amount')}</Button>}
    {error&&<p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {quote&&<>
     <div className="rounded-xl border bg-blue-50 p-4 space-y-2 text-blue-950">
      <p>{ar?'حوّل المبلغ التالي بالضبط:':'Transfer exactly:'}</p><p className="text-3xl font-bold">{new Intl.NumberFormat(ar?'ar-EG':'en',{style:'currency',currency:quote.payment_currency}).format(quote.amount_local)}</p>
      <p>{ar?'إلى المحفظة:':'To wallet:'} <strong dir="ltr">{quote.wallet_snapshot.number}</strong></p>
      <p>{ar?'الرصيد الذي سيُضاف بعد الموافقة:':'Credit after approval:'} <strong>${quote.amount_usd} USD</strong></p>
      <p className="text-xs">1 USD = {quote.exchange_rate} {quote.payment_currency}</p>
      <p className="text-xs">{ar?'تاريخ سعر الصرف:':'Rate updated:'} {new Date(quote.rate_updated_at).toLocaleString(ar?'ar-EG':'en')}</p>
      <p className="text-xs">{ar?'المبلغ مثبت حتى:':'Payment amount locked until:'} {new Date(quote.expires_at).toLocaleString(ar?'ar-EG':'en')}</p>
      <RateAttribution/>
     </div>
     <Label htmlFor="sender-phone">{ar?'رقم الهاتف الذي تم التحويل منه':'Sender phone number'}</Label><Input id="sender-phone" type="tel" value={phone} onChange={e=>setPhone(e.target.value)}/>
     <Label htmlFor="payment-proof">{ar?'صورة إثبات التحويل':'Transfer proof image'}</Label><Input id="payment-proof" type="file" accept="image/*" onChange={e=>setProof(e.target.files?.[0]||null)}/>
     <Button className="w-full" disabled={busy||!proof||!phone} onClick={submit}>{busy?(ar?'جارٍ الإرسال…':'Submitting…'):(ar?'إرسال طلب الشحن للمراجعة':'Submit recharge for review')}</Button>
    </>}
   </div>
  </DialogContent>
 </Dialog>;
}
