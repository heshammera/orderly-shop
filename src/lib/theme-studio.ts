import {hexToHsl} from './color-utils';
export type StudioSection = {type:string;settings:Record<string,any>;blocks:any[];hidden?:boolean};
export type StudioPage = {sections_order:string[];sections_data:Record<string,StudioSection>};
export type StudioDocument = {tokens:Record<string,string>;pages:Record<string,StudioPage>};
export const studioThemes = [
 {id:'default',name:'أفق',en:'Horizon',tag:'متجر متكامل',tagEn:'Everyday commerce',primary:'#176a5b',background:'#fbfaf6',ink:'#17302c',soft:'#e7eee5',layout:'split',radius:'16',font:'Tajawal'},
 {id:'elegance',name:'أتيليه',en:'Atelier',tag:'أزياء بتفاصيل هادئة',tagEn:'Editorial fashion',primary:'#603d32',background:'#faf7f2',ink:'#322823',soft:'#eae0d5',layout:'editorial',radius:'2',font:'Tajawal'},
 {id:'technova',name:'نوفا',en:'Nova',tag:'تقنية وخيارات واضحة',tagEn:'Technology essentials',primary:'#244fb3',background:'#f7f9fd',ink:'#11213a',soft:'#e0e8f6',layout:'showcase',radius:'10',font:'Tajawal'},
 {id:'cozyhome',name:'دار',en:'Dār',tag:'منزل ومساحات مريحة',tagEn:'Considered living',primary:'#75603e',background:'#fbf8f2',ink:'#3e372e',soft:'#eee5d3',layout:'journal',radius:'20',font:'Tajawal'},
 {id:'luxe',name:'أورا',en:'Aura',tag:'مساحات واسعة وتفاصيل فاخرة',tagEn:'Quiet luxury',primary:'#806527',background:'#f8f6f0',ink:'#232220',soft:'#e8e1d0',layout:'centered',radius:'0',font:'Tajawal'},
 {id:'glow',name:'بلوم',en:'Bloom',tag:'جمال وعناية بتصميم ناعم',tagEn:'Beauty and wellbeing',primary:'#963f59',background:'#fff8fa',ink:'#442a35',soft:'#f5e0e7',layout:'soft',radius:'28',font:'Tajawal'},
 {id:'activeplus',name:'موف',en:'Move',tag:'حركة وتباين قوي',tagEn:'Move with purpose',primary:'#234b3e',background:'#f6f8f2',ink:'#14281e',soft:'#dce8c7',layout:'bold',radius:'4',font:'Tajawal'},
 {id:'freshcart',name:'حصاد',en:'Harvest',tag:'تسوق يومي سريع',tagEn:'Daily essentials',primary:'#287334',background:'#fcfcf5',ink:'#233a24',soft:'#e7edd5',layout:'compact',radius:'14',font:'Tajawal'},
 {id:'kidswonder',name:'لِعب',en:'Play',tag:'ألوان لطيفة وتفاصيل مرحة',tagEn:'Small discoveries',primary:'#7451a4',background:'#fffcf7',ink:'#362c47',soft:'#eee4f8',layout:'playful',radius:'30',font:'Tajawal'},
] as const;
export const studioTheme=(id:string)=>studioThemes.find(t=>t.id===id)||studioThemes[0];
export const studioSectionLabels:Record<string,[string,string]>={header:['رأس المتجر','Header'],hero_banner:['واجهة المتجر','Hero'],category_slider:['التصنيفات','Categories'],featured_grid:['مجموعة منتجات','Product collection'],footer:['تذييل المتجر','Footer'],rich_text:['نص وصورة','Story'],image_banner:['لافتة بصورة','Image banner'],benefits:['معلومات الخدمة','Service details'],main_product:['صفحة المنتج','Product detail'],main_checkout:['إتمام الطلب','Checkout'],main_products:['قائمة المنتجات','Product listing']};
export function makeStudioSection(type:string,theme='default'):StudioSection {
 const base={studio_v2:true,theme_style:theme,heading:'',subheading:'',image_url:'',padding:56};
 const extra:Record<string,any>={header:{show_search:true,show_cart:true,notice_text:'',sticky:false},hero_banner:{layout:studioTheme(theme).layout,button_label:'',button_url:'/products',image_source:'auto',heading_size:52},category_slider:{source:'auto',limit:8},featured_grid:{source:'auto',limit:8,columns:['cozyhome','kidswonder'].includes(theme)?2:['elegance','luxe','activeplus','freshcart'].includes(theme)?3:4,show_price:true,show_add:true,image_ratio:['elegance','luxe'].includes(theme)?'portrait':'square',image_fit:'cover'},footer:{show_contact:true,show_copyright:true,body:''},rich_text:{body:'',alignment:'start'},image_banner:{button_label:'',button_url:'/products'},benefits:{items:[]},main_product:{product_layout:['elegance','cozyhome'].includes(theme)?'gallery_left':'gallery_right',image_ratio:['elegance','luxe'].includes(theme)?'portrait':'square',image_fit:'cover'},main_checkout:{layout:'split'},main_products:{columns:3}};
 return {type,settings:{...base,...extra[type]},blocks:[]};
}
export function createStudioDocument(theme='default'):StudioDocument {
 const t=studioTheme(theme);const page=(types:string[])=>({sections_order:types.map(x=>`${x}_1`),sections_data:Object.fromEntries(types.map(x=>[`${x}_1`,makeStudioSection(x,theme)]))});
 return {tokens:{studio_version:'2',studio_theme:theme,studio_primary:t.primary,studio_background:t.background,studio_ink:t.ink,studio_soft:t.soft,studio_radius:t.radius,studio_font:t.font,studio_width:'1240',studio_base_size:'16'},pages:{home:page(theme==='freshcart'?['header','category_slider','hero_banner','featured_grid','footer']:['elegance','luxe','glow'].includes(theme)?['header','hero_banner','featured_grid','category_slider','footer']:['header','hero_banner','category_slider','featured_grid','footer']),product:page(['header','main_product','footer']),checkout:page(['header','main_checkout','footer']),products:page(['header','main_products','footer'])}};
}
export function localizedValue(value:any,language='ar'):string {
 if(value==null)return '';if(typeof value==='string'){try{return localizedValue(JSON.parse(value),language)}catch{return value}}
 return typeof value==='object'?String(value[language]||value.ar||value.en||''):String(value);
}
export function productImages(value:any):string[]{if(typeof value==='string'){try{return productImages(JSON.parse(value))}catch{return value?[value]:[]}}return Array.isArray(value)?value.map(v=>typeof v==='string'?v:v?.url).filter(Boolean):[]}
export function safeThemeUrl(value:string,fallback='#'):string {if(!value)return fallback;return /^(https?:\/\/|\/[^/]|#|mailto:|tel:)/i.test(value)?value:fallback}
export function normalizeStudioDocument(document:StudioDocument):StudioDocument {
 const result=JSON.parse(JSON.stringify(document)) as StudioDocument;
 const tokens=result.tokens;
 for(const [target,source] of Object.entries({primary:'studio_primary',background:'studio_background',foreground:'studio_ink',card:'studio_background','card-foreground':'studio_ink',muted:'studio_soft',accent:'studio_soft',secondary:'studio_soft',ring:'studio_primary'}))if(/^#[0-9a-f]{6}$/i.test(tokens[source]||''))tokens[target]=hexToHsl(tokens[source]);
 tokens['primary-foreground']='0 0% 100%';tokens.radius=`${Number(tokens.studio_radius||16)/16}rem`;
 const home=result.pages.home;
 if(home){const common=home.sections_order.filter(id=>['header','footer'].includes(home.sections_data[id]?.type));for(const page of Object.values(result.pages)){if(page===home)continue;const body=page.sections_order.filter(id=>!['header','footer'].includes(page.sections_data[id]?.type));const header=common.filter(id=>home.sections_data[id].type==='header');const footer=common.filter(id=>home.sections_data[id].type==='footer');page.sections_order=[...header,...body,...footer];for(const id of common)page.sections_data[id]=JSON.parse(JSON.stringify(home.sections_data[id]));}}
 return result;
}
