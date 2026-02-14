
import { useState, useEffect } from 'react';
import { ComponentSchema } from '@/lib/store-builder/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface SocialProofProps extends ComponentSchema { }

export function SocialProof({ data }: { data: ComponentSchema }) {
    const { settings, content } = data;
    const { language } = useLanguage();
    const [visible, setVisible] = useState(false);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    const messages = content.messages || [];
    const delay = settings.delay || 5000;
    const position = settings.position || 'bottom-left';

    useEffect(() => {
        if (messages.length === 0) return;

        const interval = setInterval(() => {
            setVisible(true);
            setTimeout(() => {
                setVisible(false);
                setTimeout(() => {
                    setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
                }, 1000);
            }, 4000); // Show for 4 seconds
        }, delay + 4000); // Wait delay + show time

        // Initial show
        const initialTimeout = setTimeout(() => {
            setVisible(true);
            setTimeout(() => {
                setVisible(false);
            }, 4000);
        }, 2000);

        return () => {
            clearInterval(interval);
            clearTimeout(initialTimeout);
        };
    }, [messages.length, delay]);

    if (messages.length === 0) return null;

    const currentMessage = messages[currentMessageIndex];
    const text = typeof currentMessage === 'string' ? currentMessage : (currentMessage?.[language] || '');

    const isBottom = position.includes('bottom');
    const isLeft = position.includes('left');

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: isBottom ? 20 : -20, x: isLeft ? -20 : 20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: isBottom ? 20 : -20 }}
                    className={cn(
                        "fixed z-50 bg-white shadow-lg border rounded-lg p-3 flex items-center gap-3 max-w-sm pointer-events-none",
                        isBottom ? "bottom-4" : "top-4",
                        isLeft ? "left-4" : "right-4"
                    )}
                >
                    <div className="bg-primary/10 p-2 rounded-full">
                        {text.includes('viewing') ? <Users className="w-5 h-5 text-primary" /> : <MapPin className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="text-sm font-medium text-slate-700">
                        {text}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
