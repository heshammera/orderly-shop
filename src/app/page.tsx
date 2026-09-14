import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/landing/MarketingHeader';
import { MarketingHome } from '@/components/landing/MarketingHome';
import { MarketingFooter } from '@/components/landing/MarketingFooter';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export const metadata: Metadata = {
 title: 'أوردرلي | إنشاء متجر إلكتروني وإدارة الطلبات',
 description: 'أنشئ متجرك الإلكتروني، اعرض منتجاتك بخياراتها وتابع الطلبات من لوحة عربية واضحة. جرّب المتجر التجريبي وراجع الباقات والتكاليف قبل البدء.',
 alternates: {canonical:'https://orderlyshops.com/',languages:{ar:'https://orderlyshops.com/',en:'https://orderlyshops.com/en','x-default':'https://orderlyshops.com/'}},
 openGraph: {title:'Orderly | متجرك وطلباتك في مكان واحد', description:'جرّب المتجر التوضيحي، تعرف على الخيارات والسلة والطلب المباشر، واختر الباقة المناسبة.',url:'https://orderlyshops.com/',images:[{url:'https://orderlyshops.com/opengraph-image',width:1200,height:630}],type:'website'},
 twitter:{card:'summary_large_image',images:['https://orderlyshops.com/opengraph-image']}
};
export default async function Home() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Fetch tutorials visibility setting
  let tutorialsEnabled = true;
  try {
    const { data: settingData } = await supabase.rpc('get_setting', { setting_key: 'tutorials_enabled_landing' });
    if (settingData !== null && settingData !== undefined) {
      const val = String(settingData).replace(/"/g, '');
      tutorialsEnabled = val === 'true';
    }
  } catch (e) {
    console.error("Failed to fetch tutorials setting", e);
  }

  return <div className="min-h-screen bg-[#fcfcf8]">
    <MarketingHeader tutorialsEnabled={tutorialsEnabled}/>
    <MarketingHome/>
    <MarketingFooter/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'Organization',name:'شركة أوردرلي للتسويق وإدارة الأعمال',alternateName:'Orderly',url:'https://orderlyshops.com',logo:'https://orderlyshops.com/logo.png'})}}/>
  </div>;
}
