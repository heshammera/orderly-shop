"use client";

import { useLanguage } from '@/contexts/LanguageContext';

const partners = [
    { name: 'Stripe', logo: '💳', color: 'text-indigo-500' },
    { name: 'PayPal', logo: '🅿️', color: 'text-blue-500' },
    { name: 'Paymob', logo: '📱', color: 'text-blue-600' },
    { name: 'Aramex', logo: '📦', color: 'text-red-500' },
    { name: 'SMSA', logo: '🚚', color: 'text-orange-500' },
    { name: 'DHL', logo: '✈️', color: 'text-yellow-500' },
    { name: 'Apple Pay', logo: '🍎', color: 'text-slate-800' },
    { name: 'Google Pay', logo: '🇬', color: 'text-slate-600' },
];

export function Partners() {
    const { language } = useLanguage();

    return (
        <section className="py-16 bg-white border-b border-slate-100 overflow-hidden">
            <div className="container mx-auto px-4 mb-10 text-center">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    {language === 'ar' ? 'شركاء النجاح الموثوقين' : 'Trusted Success Partners'}
                </p>
            </div>

            {/* Marquee Container */}
            <div className="relative w-full overflow-hidden flex whitespace-nowrap">
                {/* Left Gradient Mask */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />

                {/* Right Gradient Mask */}
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />

                <div className="flex animate-marquee min-w-max gap-16 px-8 items-center">
                    {[...partners, ...partners, ...partners].map((partner, idx) => (
                        <div key={idx} className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100 cursor-pointer">
                            <span className="text-3xl">{partner.logo}</span>
                            <span className={`text-xl font-bold ${partner.color}`}>{partner.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
            animation: marquee 20s linear infinite;
        }
        /* Handle RTL properly */
        html[dir='rtl'] .animate-marquee {
            animation: marquee-rtl 20s linear infinite;
        }
        @keyframes marquee-rtl {
            0% { transform: translateX(0); }
            100% { transform: translateX(33.33%); }
        }
      `}</style>
        </section>
    );
}
