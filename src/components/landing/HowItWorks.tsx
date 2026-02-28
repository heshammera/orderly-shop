"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { UserPlus, PlusSquare, Rocket } from 'lucide-react';

export function HowItWorks() {
    const { language } = useLanguage();

    const steps = [
        {
            title: language === 'ar' ? 'سجل حسابك' : 'Sign Up',
            description: language === 'ar'
                ? 'بخطوات بسيطة وسريعة، أنشئ حسابك وابدأ رحلتك.'
                : 'In quick and simple steps, create your account and start your journey.',
            icon: UserPlus,
        },
        {
            title: language === 'ar' ? 'أضف منتجاتك' : 'Add Products',
            description: language === 'ar'
                ? 'ارفع صور وتفاصيل منتجاتك ونظمها في أقسام.'
                : 'Upload images and details of your products and organize them in categories.',
            icon: PlusSquare,
        },
        {
            title: language === 'ar' ? 'ابدأ البيع' : 'Start Selling',
            description: language === 'ar'
                ? 'استقبل الطلبات وابدأ بجني الأرباح فوراً بدون عمولات مخفية.'
                : 'Receive orders and start making profits immediately with no hidden fees.',
            icon: Rocket,
        },
    ];

    return (
        <section className="py-24 bg-slate-50 border-b border-slate-100">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16 animate-fade-in">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
                        {language === 'ar' ? 'كيف تبدأ؟' : 'How it Works?'}
                    </h2>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto block">
                        {language === 'ar' ? 'ثلاث خطوات بسيطة تفصلك عن متجرك الاحترافي' : 'Three simple steps separate you from your professional store'}
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-slate-200 -z-10 -translate-y-1/2"></div>
                    {steps.map((step, idx) => (
                        <div key={idx} className="relative group text-center animate-fade-in-up" style={{ animationDelay: `${idx * 0.2}s` }}>
                            <div className="w-20 h-20 mx-auto bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-teal-50 transition-all duration-300">
                                <step.icon className="w-8 h-8 text-teal-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">{step.title}</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
