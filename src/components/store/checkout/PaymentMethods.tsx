import { useCheckout } from '@/contexts/CheckoutContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Wallet, CreditCard, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PaymentMethods() {
    const { paymentMethod, setPaymentMethod } = useCheckout();
    const { language } = useLanguage();

    const methods = [
        {
            id: 'cod',
            title: language === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery',
            description: language === 'ar' ? 'ادفع نقداً عند استلام طلبك' : 'Pay in cash when you receive your order',
            icon: Wallet,
            disabled: false
        },
        {
            id: 'bank_transfer',
            title: language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer',
            description: language === 'ar' ? 'تحويل مباشر لحساب المؤسسة (قريباً)' : 'Direct transfer to our bank account (Coming Soon)',
            icon: Building2,
            disabled: true
        },
        {
            id: 'online',
            title: language === 'ar' ? 'البطاقة الائتمانية / مدى' : 'Credit Card / Mada',
            description: language === 'ar' ? 'دفع إلكتروني آمن (قريباً)' : 'Secure online payment (Coming Soon)',
            icon: CreditCard,
            disabled: true
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                <span className="flex items-center justify-center w-5 h-5 bg-slate-100 rounded text-[10px] text-slate-500">3</span>
                {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
            </div>

            <RadioGroup defaultValue={paymentMethod} onValueChange={setPaymentMethod} className="grid gap-4">
                {methods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.id;

                    return (
                        <div key={method.id} className="relative">
                            <RadioGroupItem
                                value={method.id}
                                id={`payment-${method.id}`}
                                className="peer sr-only"
                                disabled={method.disabled}
                            />
                            <Label
                                htmlFor={`payment-${method.id}`}
                                className={cn(
                                    "flex items-center gap-4 p-4 border rounded-xl transition-all",
                                    method.disabled ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-100" : "cursor-pointer hover:bg-slate-50",
                                    isSelected && !method.disabled ? "border-primary bg-primary/5 ring-1 ring-primary" : (!method.disabled ? "border-slate-200 bg-white" : "")
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-10 h-10 rounded-full",
                                    isSelected && !method.disabled ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-500"
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm text-slate-900">{method.title}</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">{method.description}</p>
                                </div>

                                {/* Radio Indicator */}
                                <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                    isSelected ? "border-primary" : "border-slate-300"
                                )}>
                                    {isSelected && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                                </div>
                            </Label>
                        </div>
                    );
                })}
            </RadioGroup>
        </div>
    );
}
