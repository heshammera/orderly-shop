'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageSquare, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface AIResponseGeneratorProps {
    storeId: string;
    storeName: string;
}

export function AIResponseGenerator({ storeId, storeName }: AIResponseGeneratorProps) {
    const { language } = useLanguage();
    const [message, setMessage] = useState('');
    const [tone, setTone] = useState('professional');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ ar: string; en: string } | null>(null);

    const handleGenerate = async () => {
        if (!message.trim()) {
            toast.error(language === 'ar' ? 'الرجاء إدخال رسالة العميل' : 'Please enter customer message');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate-response',
                    storeId,
                    storeName,
                    message,
                    responseTone: tone
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                setResult({
                    ar: data.data.response_ar,
                    en: data.data.response_en
                });
                toast.success(language === 'ar' ? 'تم إنشاء الرد بنجاح!' : 'Response generated successfully!');
            } else {
                throw new Error(data.error || 'Failed to generate');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(language === 'ar' ? 'تم النسخ' : 'Copied');
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-500" />
                    <CardTitle>{language === 'ar' ? 'مولّد الردود على العملاء' : 'Customer Response Generator'}</CardTitle>
                </div>
                <CardDescription>
                    {language === 'ar' 
                        ? 'الصق رسالة أو استفسار العميل هنا ليقوم الذكاء الاصطناعي بصياغة رد احترافي.' 
                        : 'Paste customer message or inquiry here to let AI draft a professional response.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                <div className="space-y-2">
                    <Label>{language === 'ar' ? 'رسالة العميل' : 'Customer Message'}</Label>
                    <Textarea 
                        value={message} 
                        onChange={(e) => setMessage(e.target.value)} 
                        placeholder={language === 'ar' ? 'مثال: طلبي متأخر له 3 أيام، متى بيوصل؟' : 'Example: My order is delayed for 3 days, when will it arrive?'}
                        rows={4}
                    />
                </div>

                <div className="space-y-2">
                    <Label>{language === 'ar' ? 'نبرة الرد المطلوبة' : 'Desired Tone'}</Label>
                    <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="professional">{language === 'ar' ? 'احترافي' : 'Professional'}</SelectItem>
                            <SelectItem value="friendly">{language === 'ar' ? 'ودود ولطيف' : 'Friendly'}</SelectItem>
                            <SelectItem value="apologetic">{language === 'ar' ? 'اعتذار وتعاطف' : 'Apologetic & Empathetic'}</SelectItem>
                            <SelectItem value="strict">{language === 'ar' ? 'رسمي وصارم (للشروط)' : 'Strict & Formal'}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button onClick={handleGenerate} disabled={loading} className="w-full">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {language === 'ar' ? 'توليد الرد' : 'Generate Response'}
                </Button>

                {result && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        {/* Arabic Response */}
                        <div className="bg-muted p-4 rounded-lg space-y-2 relative border border-border">
                            <Label className="text-primary flex justify-between items-center w-full">
                                {language === 'ar' ? 'الرد بالعربية' : 'Arabic Response'}
                                <Button size="sm" variant="ghost" onClick={() => handleCopy(result.ar)}><Copy className="w-4 h-4" /></Button>
                            </Label>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed" dir="rtl">{result.ar}</p>
                        </div>
                        
                        {/* English Response */}
                        <div className="bg-muted p-4 rounded-lg space-y-2 relative border border-border">
                            <Label className="text-primary flex justify-between items-center w-full">
                                {language === 'ar' ? 'الرد بالإنجليزية' : 'English Response'}
                                <Button size="sm" variant="ghost" onClick={() => handleCopy(result.en)}><Copy className="w-4 h-4" /></Button>
                            </Label>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed" dir="ltr">{result.en}</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
