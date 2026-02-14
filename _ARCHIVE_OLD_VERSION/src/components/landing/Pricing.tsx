import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export function Pricing() {
  const { t } = useLanguage();

  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.pricing.title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.pricing.subtitle}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {t.pricing.plans.map((plan, index) => {
            const isPopular = index === 1;
            return (
              <div
                key={index}
                className={cn(
                  'relative bg-card rounded-2xl p-8 border transition-all duration-300 animate-fade-in-up',
                  isPopular
                    ? 'border-primary shadow-glow scale-105 z-10'
                    : 'border-border hover:border-primary/30'
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-4 start-1/2 -translate-x-1/2 rtl:translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
                      {t.pricing.popular}
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    {plan.price === '0' ? (
                      <span className="text-4xl font-extrabold">{t.pricing.free}</span>
                    ) : (
                      <>
                        <span className="text-4xl font-extrabold">{plan.price}</span>
                        <span className="text-muted-foreground">{t.pricing.currency}/{t.pricing.monthly}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link to="/auth?signup=true">
                  <Button
                    className={cn(
                      'w-full',
                      isPopular
                        ? 'gradient-primary hover:opacity-90'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                  >
                    {t.pricing.cta}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
