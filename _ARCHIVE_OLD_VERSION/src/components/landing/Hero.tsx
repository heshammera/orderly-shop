import { ArrowLeft, ArrowRight, Play, Store, ShoppingBag, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

export function Hero() {
  const { t, language, dir } = useLanguage();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 start-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 end-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-start animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              {t.hero.title}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              {t.hero.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link to="/auth?signup=true">
                <Button size="lg" className="gradient-primary text-lg px-8 hover:opacity-90 transition-opacity group">
                  {t.hero.cta}
                  <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 group">
                <Play className="h-5 w-5 me-2" />
                {t.hero.secondaryCta}
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 justify-center lg:justify-start">
              <div className="flex -space-x-3 rtl:space-x-reverse">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground"
                  >
                    {i * 2}K
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">+2,500</span> {t.hero.merchants}
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative animate-fade-in hidden lg:block">
            <div className="relative z-10">
              {/* Main card */}
              <div className="bg-card rounded-2xl shadow-soft border border-border p-6 animate-float">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <Store className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">متجر أحمد</h3>
                    <p className="text-sm text-muted-foreground">نشط الآن</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">156</p>
                    <p className="text-xs text-muted-foreground">منتج</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-success">89</p>
                    <p className="text-xs text-muted-foreground">طلب</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-accent">12K</p>
                    <p className="text-xs text-muted-foreground">ر.س</p>
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <div className="absolute -top-8 -start-8 bg-card rounded-xl shadow-soft border border-border p-4 animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium">طلب جديد!</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -end-4 bg-card rounded-xl shadow-soft border border-border p-4 animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">+24% هذا الأسبوع</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
