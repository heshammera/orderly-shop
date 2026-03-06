import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { SocialProofSection } from '@/components/landing/SocialProofSection';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { PlatformDemo } from '@/components/landing/PlatformDemo';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { AdvancedCapabilities } from '@/components/landing/AdvancedCapabilities';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';
import { ScrollToTop } from '@/components/landing/ScrollToTop';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { TutorialsSection } from '@/components/landing/TutorialsSection';

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

  return (
    <div className="min-h-screen font-sans bg-slate-50">
      <Header tutorialsEnabled={tutorialsEnabled} />
      <main>
        <HeroSection />
        <SocialProofSection />
        <FeaturesGrid />
        <PlatformDemo />
        <HowItWorksSection />
        <AdvancedCapabilities />
        <PricingSection />
        {tutorialsEnabled && <TutorialsSection />}
        <FinalCTA />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
