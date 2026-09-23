'use client';
import {useEffect,useState} from 'react';
import SectionRenderer from '@/components/ThemeEngine/SectionRenderer';
import ThemeVariables from '@/components/ThemeEngine/ThemeVariables';
import {CartPreviewProvider} from '@/contexts/CartContext';
import {useLanguage} from '@/contexts/LanguageContext';
export default function StudioPreviewFrame(){
 const [preview,setPreview]=useState<any>(null);const {setLanguage}=useLanguage();
 useEffect(()=>{const receive=(e:MessageEvent)=>{if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='STUDIO_PREVIEW')return;const value=e.data.payload;if(!value?.pageData?.sections_order||!value.context||!value.tokens)return;setPreview(value);setLanguage(value.language==='en'?'en':'ar')};window.addEventListener('message',receive);parent.postMessage({type:'STUDIO_READY'},location.origin);return()=>window.removeEventListener('message',receive)},[setLanguage]);
 if(!preview)return <p className="p-8 text-center text-sm text-slate-500">جاري تجهيز المعاينة…</p>;
 return <CartPreviewProvider><ThemeVariables tokens={preview.tokens} isRTL={preview.language!=='en'}/><div onClickCapture={e=>{if((e.target as HTMLElement).closest('a'))e.preventDefault();const section=(e.target as HTMLElement).closest('section[id]');if(section)parent.postMessage({type:'STUDIO_SELECT',sectionId:section.id},location.origin)}}><SectionRenderer pageData={preview.pageData} storeContext={{...preview.context,isEditorPreview:true,themeTokens:preview.tokens}}/></div></CartPreviewProvider>;
}
