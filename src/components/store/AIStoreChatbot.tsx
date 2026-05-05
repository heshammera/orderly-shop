'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface AIStoreChatbotProps {
    storeSlug: string;
    storeName?: string;
}

export function AIStoreChatbot({ storeSlug, storeName = 'المتجر' }: AIStoreChatbotProps) {
    const { language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: language === 'ar' ? `مرحباً بك في ${storeName}! كيف يمكنني مساعدتك اليوم؟` : `Welcome to ${storeName}! How can I help you today?` }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await fetch(`/api/store/${storeSlug}/ai-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages.slice(1) // exclude the initial welcome message from history to save tokens
                })
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: language === 'ar' ? 'عذراً، أواجه مشكلة في الاتصال حالياً. حاول مرة أخرى.' : 'Sorry, I am having trouble connecting. Please try again.' }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: language === 'ar' ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* Chat Panel */}
            <div className={cn(
                "transition-all duration-300 origin-bottom-right shadow-2xl rounded-2xl overflow-hidden",
                isOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-50 opacity-0 pointer-events-none"
            )}>
                <Card className="w-[350px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] flex flex-col border-primary/20">
                    <CardHeader className="bg-primary text-primary-foreground py-3 px-4 flex flex-row items-center justify-between rounded-t-xl m-0 space-y-0">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary-foreground/80" />
                            <CardTitle className="text-base font-semibold">{language === 'ar' ? 'مساعد التسوق الذكي' : 'Smart Shopping Assistant'}</CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 rounded-full" onClick={() => setIsOpen(false)}>
                            <X className="w-5 h-5" />
                        </Button>
                    </CardHeader>
                    
                    <CardContent className="flex-1 p-4 overflow-y-auto bg-muted/30 flex flex-col gap-4" ref={scrollRef}>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={cn("flex max-w-[85%]", msg.role === 'user' ? "self-end" : "self-start")}>
                                <div className={cn(
                                    "p-3 rounded-2xl text-sm leading-relaxed",
                                    msg.role === 'user' 
                                        ? "bg-primary text-primary-foreground rounded-br-none" 
                                        : "bg-background border shadow-sm rounded-bl-none text-foreground"
                                )}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex max-w-[85%] self-start">
                                <div className="p-3 rounded-2xl rounded-bl-none bg-background border shadow-sm flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <div className="p-3 bg-background border-t">
                        <div className="relative flex items-center">
                            <Input 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={language === 'ar' ? "اكتب رسالتك هنا..." : "Type your message..."}
                                className={cn("pr-12", language === 'ar' ? "pl-12 pr-3" : "")}
                                disabled={loading}
                            />
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                className={cn("absolute h-8 w-8 text-primary hover:bg-primary/10", language === 'ar' ? "left-1" : "right-1")} 
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                            >
                                <Send className={cn("w-4 h-4", language === 'ar' ? "rotate-180" : "")} />
                            </Button>
                        </div>
                        <div className="text-[10px] text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {language === 'ar' ? 'يعمل بالذكاء الاصطناعي - قد تختلف دقة الإجابات' : 'AI Powered - Accuracy may vary'}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Toggle Button */}
            <Button 
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 p-0 flex items-center justify-center",
                    isOpen ? "bg-muted text-muted-foreground hover:bg-muted" : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
                )}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
            </Button>
        </div>
    );
}
