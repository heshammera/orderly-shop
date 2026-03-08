import { useCheckout } from '@/contexts/CheckoutContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProgressBar() {
    const { currentStep } = useCheckout();
    const { language } = useLanguage();

    const steps = [
        { id: 1, label: language === 'ar' ? 'التواصل' : 'Contact' },
        { id: 2, label: language === 'ar' ? 'الشحن' : 'Shipping' },
        { id: 3, label: language === 'ar' ? 'الدفع' : 'Payment' },
    ];

    return (
        <div className="w-full mb-8">
            <div className="flex justify-between items-center relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded" />
                <div
                    className="absolute top-1/2 left-0 h-1 bg-primary -z-10 -translate-y-1/2 rounded transition-all duration-300"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 border-2",
                                    isActive ? "bg-primary text-primary-foreground border-primary" :
                                        isCompleted ? "bg-primary text-primary-foreground border-primary" :
                                            "bg-white text-slate-400 border-slate-200"
                                )}
                            >
                                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                            </div>
                            <span
                                className={cn(
                                    "text-xs font-semibold",
                                    isActive ? "text-primary" :
                                        isCompleted ? "text-slate-700" :
                                            "text-slate-400"
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
