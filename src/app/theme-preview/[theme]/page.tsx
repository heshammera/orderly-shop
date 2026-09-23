import catalog from '@/lib/theme-catalog.json';
import {notFound} from 'next/navigation';
import {StudioSection} from '@/components/theme-studio/StudioSection';
import {createStudioDocument,studioThemes,normalizeStudioDocument} from '@/lib/theme-studio';
export const metadata={title:'معاينة الثيم | أوردرلي',robots:{index:false,follow:false}};
export default function ThemeCatalogPreview({params}:{params:{theme:string}}){
 const theme=studioThemes.find(t=>t.id===params.theme);if(!theme)notFound();
 const doc=normalizeStudioDocument(createStudioDocument(theme.id));
 const products=(catalog[theme.id]||catalog.default).map((item,i)=>({id:`preview-${i}`,name:item.name,price:240+i*60,images:[item.image]}));
 const headlines:Record<string,string>={default:'كل ما تحبّه، في مكان واحد.',elegance:'أسلوبك يبدأ من التفاصيل.',technova:'تقنية تواكب يومك.',cozyhome:'مساحة تشبهك.',luxe:'الأقلّ، بتفاصيل استثنائية.',glow:'لحظتك. جمالك. بطريقتك.',activeplus:'تحرّك نحو نسختك الأفضل.',freshcart:'اختيارات طازجة، كل يوم.',kidswonder:'عالم صغير، وخيال كبير.'};
 doc.pages.home.sections_data.hero_banner_1.settings.heading=headlines[theme.id];
 const context={isCatalogPreview:true,themeTokens:doc.tokens,store:{name:{ar:theme.name,en:theme.en},description:{ar:'اختيارات مدروسة، لحياتك كل يوم.',en:'Thoughtful choices for your everyday.'},currency:'EGP',has_removed_copyright:false},products,categories:[{id:'collection',name:{ar:'المجموعة الجديدة',en:'New collection'}},{id:'essentials',name:{ar:'الأساسيات',en:'Essentials'}}]};
 return <main><div className="bg-slate-900 px-4 py-2 text-center text-xs text-white" role="note">معاينة حقيقية للثيم ببيانات عرض فقط — سيستخدم متجرك منتجاتك وبياناتك تلقائيًا</div>{doc.pages.home.sections_order.map(id=>{const section=doc.pages.home.sections_data[id];return <section key={id}><StudioSection {...section} storeContext={context}/></section>})}</main>;
}
