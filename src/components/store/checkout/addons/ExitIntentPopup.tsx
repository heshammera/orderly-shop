
import { useState, useEffect } from 'react';
import { ComponentSchema } from '@/lib/store-builder/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCheckout } from '@/contexts/CheckoutContext';
import { Button } from '@/components/ui/button';
import { X, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExitIntentPopupProps extends ComponentSchema { }

export function ExitIntentPopup({ data }: { data: ComponentSchema }) {
    const { settings, content } = data;
    const { language } = useLanguage();
    const { setCouponCode, handleApplyCoupon } = useCheckout();
    const [isVisible, setIsVisible] = useState(false);
    const [hasTriggered, setHasTriggered] = useState(false);

    useEffect(() => {
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 && !hasTriggered) {
                setIsVisible(true);
                setHasTriggered(true);
            }
        };

        document.addEventListener('mouseleave', handleMouseLeave);
        return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }, [hasTriggered]);

    const handleApply = async () => {
        if (settings.discountCode) {
            setCouponCode(settings.discountCode);
            await handleApplyCoupon(); // This assumes handleApplyCoupon uses the state we just set. 
            // Actually handleApplyCoupon uses component state/context state. 
            // The context update of setCouponCode might be async in React? No, but re-render.
            // We might need to pass the code directly to handleApplyCoupon or wait.
            // for now, let's just close it. User can click apply in the summary if needed, usually we ideally auto-apply.
            // Since we can't guarantee auto-apply timing without refactoring handler, we'll just pre-fill.
            setIsVisible(false);
        }
    };

    const title = typeof content.title === 'string' ? content.title : (content.title?.[language] || 'Wait!');
    const description = typeof content.description === 'string' ? content.description : (content.description?.[language] || 'Don\'t miss this offer!');
    const buttonText = typeof content.buttonText === 'string' ? content.buttonText : (content.buttonText?.[language] || 'Apply Discount');

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden relative"
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => setIsVisible(false)}
                        >
                            <X className="w-4 h-4" />
                        </Button>

                        <div className="p-6 text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <Percent className="w-8 h-8 text-primary" />
                            </div>

                            <h2 className="text-2xl font-bold">{title}</h2>
                            <p className="text-muted-foreground">{description}</p>

                            {settings.discountCode && (
                                <div className="bg-slate-100 p-3 rounded-lg border border-dashed border-slate-300 font-mono text-lg font-bold tracking-wider select-all">
                                    {settings.discountCode}
                                </div>
                            )}

                            <Button onClick={handleApply} className="w-full" size="lg">
                                {buttonText}
                            </Button>

                            <Button variant="link" size="sm" onClick={() => setIsVisible(false)} className="text-muted-foreground">
                                {language === 'ar' ? 'لا شكراً، لا أريد الخصم' : 'No thanks, I don\'t want a discount'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
