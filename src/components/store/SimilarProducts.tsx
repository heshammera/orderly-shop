"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useLanguage} from '@/contexts/LanguageContext';
import {useCart} from '@/contexts/CartContext';
import {localizedValue,productImages} from '@/lib/theme-studio';
import {ArrowUpLeft,Package,Plus} from 'lucide-react';
export function SimilarProducts({store,productId,preview=false}:{store:any;productId:string;categoryId?:string;preview?:boolean}){
 const {language}=useLanguage(),ar=language==='ar';const {addToCart,loading:cartLoading}=useCart();
 const [data,setData]=useState<{title?:any;products:any[]}>({products:[]});const [adding,setAdding]=useState<string|null>(null);
 useEffect(()=>{const controller=new AbortController();setData({products:[]});if(!productId||!store.slug||preview)return;
 fetch(`/api/store/${encodeURIComponent(store.slug)}/products/${encodeURIComponent(productId)}/recommendations`,{signal:controller.signal,cache:'no-store'}).then(r=>r.ok?r.json():null).then(result=>{if(result&&Array.isArray(result.products))setData(result)}).catch(()=>{});return()=>controller.abort();},[store.slug,productId,preview]);
 if(!data.products.length)return null;
 const base=store.baseUrl??`/s/${store.slug}`;
 const money=(value:number)=>new Intl.NumberFormat(ar?'ar-EG':'en',{style:'currency',currency:store.currency||'EGP'}).format(value);
 const price=(p:any)=>Number(p.sale_price)>0&&Number(p.sale_price)<Number(p.price)?Number(p.sale_price):Number(p.price);
 const add=async(p:any)=>{setAdding(p.id);try{await addToCart({productId:p.id,productName:{ar:localizedValue(p.name,'ar'),en:localizedValue(p.name,'en')},productImage:productImages(p.images)[0]||null,basePrice:Number(p.price),unitPrice:price(p),quantity:1,variants:[],addedAt:new Date().toISOString()})}finally{setAdding(null)}};
 return <section aria-label={ar?'المنتجات المقترحة':'Recommended products'} className="mx-auto w-full max-w-7xl border-t px-4 py-10 md:px-8 md:py-14" dir={ar?'rtl':'ltr'}><h2 className="mb-6 text-2xl font-bold">{localizedValue(data.title,language)||(ar?'قد يعجبك أيضًا':'You may also like')}</h2><div className="grid grid-cols-2 gap-4 lg:grid-cols-4 md:gap-6">{data.products.map(p=><article key={p.id} data-recommended-product={p.id} className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground transition-shadow hover:shadow-md"><Link href={`${base}/${p.id}`} className="block aspect-square overflow-hidden bg-muted">{productImages(p.images)[0]?<img src={productImages(p.images)[0]} alt={localizedValue(p.name,language)} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"/>:<span className="flex h-full items-center justify-center"><Package className="h-9 w-9 opacity-30"/></span>}</Link><div className="flex flex-1 flex-col gap-3 p-3 md:p-4"><h3 className="line-clamp-2 text-sm font-semibold"><Link href={`${base}/${p.id}`}>{localizedValue(p.name,language)}</Link></h3><div className="flex flex-wrap gap-2 text-sm"><strong>{money(price(p))}</strong>{price(p)<Number(p.price)&&<del className="text-xs text-muted-foreground">{money(Number(p.price))}</del>}</div>{p.skip_cart?<Link href={`${base}/${p.id}`} className="mt-auto flex min-h-11 items-center justify-center gap-2 rounded-lg border px-2 text-xs font-medium">{ar?'عرض المنتج والطلب':'View product & order'}<ArrowUpLeft size={15}/></Link>:<button type="button" disabled={cartLoading||adding===p.id} onClick={()=>add(p)} className="mt-auto flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-2 text-xs font-medium text-primary-foreground disabled:opacity-50"><Plus size={15}/>{adding===p.id?(ar?'جاري الإضافة…':'Adding…'):(ar?'أضف إلى السلة':'Add to cart')}</button>}</div></article>)}</div></section>;
}
