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

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <SocialProofSection />
        <FeaturesGrid />
        <PlatformDemo />
        <HowItWorksSection />
        <AdvancedCapabilities />
        <PricingSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
