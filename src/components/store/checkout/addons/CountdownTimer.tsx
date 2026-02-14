
import { useState, useEffect } from 'react';
import { ComponentSchema } from '@/lib/store-builder/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps extends ComponentSchema { }

export function CountdownTimer({ data }: { data: ComponentSchema }) {
    const { settings, content } = data;
    const { language } = useLanguage();
    const duration = (settings.durationMinutes || 10) * 60;
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const message = typeof content.message === 'string' ? content.message : (content.message?.[language] || 'Offer expires in:');

    if (timeLeft === 0) return null;

    return (
        <div
            className="w-full py-3 px-4 rounded-md flex items-center justify-center gap-2 text-sm font-medium animate-pulse"
            style={{
                backgroundColor: settings.backgroundColor || '#fef2f2',
                color: settings.textColor || '#dc2626'
            }}
        >
            <Clock className="w-4 h-4" />
            <span>{message} <span className="font-bold font-mono text-lg ml-1">{timeString}</span></span>
        </div>
    );
}
