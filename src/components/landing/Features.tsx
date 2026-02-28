"use client";

import { Package, ClipboardList, Store, BarChart3, Wallet, Megaphone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const iconMap = [Package, ClipboardList, Store, BarChart3, Wallet, Megaphone];

export function Features() {
  const { t } = useLanguage();

  return (
    <section id="features" className="py-24 bg-white border-b border-slate-100">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.features.title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.features.subtitle}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.items.map((feature, index) => {
            const Icon = iconMap[index];
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 border border-slate-100 hover:border-teal-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-6 group-hover:bg-teal-100 transition-colors">
                  <Icon className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
