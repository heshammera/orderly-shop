import { useState, useEffect } from 'react';
export function useExchangeRate(targetCurrency:string) {
 const [state,setState]=useState({currency:targetCurrency,rate:0,loading:true,error:null as string|null,lastUpdated:null as Date|null});
 useEffect(()=>{
  let active=true;
  const load=async()=>{
   setState({currency:targetCurrency,rate:0,loading:true,error:null,lastUpdated:null});
   try {
    const response=await fetch(`/api/currency/rate?currency=${encodeURIComponent(targetCurrency)}`,{cache:'no-store'});
    const data=await response.json();
    if(!response.ok||!Number.isFinite(data.rate)||data.rate<=0) throw new Error(data.error || 'سعر الصرف غير متاح حاليًا');
    if(active)setState({currency:targetCurrency,rate:data.rate,loading:false,error:null,lastUpdated:new Date(data.updatedAt)});
   }catch(error:any){if(active)setState({currency:targetCurrency,rate:0,loading:false,error:error.message,lastUpdated:null});}
  };
  load();const timer=setInterval(load,30*60*1000);
  return()=>{active=false;clearInterval(timer);};
 },[targetCurrency]);
 return state.currency===targetCurrency?state:{rate:0,loading:true,error:null,lastUpdated:null};
}
export function convertUsdToTarget(amount:number,rate:number):number {return Number.isFinite(rate)&&rate>0?amount*rate:NaN;}
