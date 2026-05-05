'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface AIEmailWriterProps {
    storeId: string;
    storeName: string;
}

export function AIEmailWriter({ storeId, storeName }: AIEmailWriterProps) {
    const { language } = useLanguage();
    const [emailType, setEmailType] = useState('abandoned_cart');
    const [customerName, setCustomerName] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ subject: string; content: string } | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate-email',
                    storeId,
                    emailType,
                    data: {
                        storeName,
                        customerName,
                        additionalInfo
                    }
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                setResult(data.data);
                toast.success(language === 'ar' ? 'تم كتابة البريد بنجاح!' : 'Email written successfully!');
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
                    <Mail className="w-5 h-5 text-purple-500" />
                    <CardTitle>{language === 'ar' ? 'كاتب البريد الإلكتروني الذكي' : 'AI Email Writer'}</CardTitle>
                </div>
                <CardDescription>
                    {language === 'ar' 
                        ? 'أنشئ رسائل بريد إلكتروني مقنعة ومصممة لزيادة المبيعات واستعادة العملاء.' 
                        : 'Create persuasive emails designed to boost sales and recover customers.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>{language === 'ar' ? 'نوع البريد' : 'Email Type'}</Label>
                        <Select value={emailType} onValueChange={setEmailType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="abandoned_cart">{language === 'ar' ? 'استعادة سلة مهجورة' : 'Abandoned Cart Recovery'}</SelectItem>
                                <SelectItem value="welcome">{language === 'ar' ? 'ترحيب بعميل جديد' : 'Welcome New Customer'}</SelectItem>
                                <SelectItem value="special_offer">{language === 'ar' ? 'عرض خاص / خصم' : 'Special Offer / Discount'}</SelectItem>
                                <SelectItem value="win_back">{language === 'ar' ? 'استعادة عميل قديم' : 'Win Back Old Customer'}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>{language === 'ar' ? 'اسم العميل (اختياري)' : 'Customer Name (Optional)'}</Label>
                        <Input 
                            value={customerName} 
                            onChange={(e) => setCustomerName(e.target.value)} 
                            placeholder={language === 'ar' ? 'أحمد' : 'Ahmed'}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>{language === 'ar' ? 'معلومات إضافية (اختياري)' : 'Additional Info (Optional)'}</Label>
                    <Input 
                        value={additionalInfo} 
                        onChange={(e) => setAdditionalInfo(e.target.value)} 
                        placeholder={language === 'ar' ? 'مثال: كود خصم 15% هو SAVE15' : 'Example: 15% discount code is SAVE15'}
                    />
                </div>

                <Button onClick={handleGenerate} disabled={loading} className="w-full">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {language === 'ar' ? 'كتابة البريد الإلكتروني' : 'Write Email'}
                </Button>

                {result && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                            <Label className="text-primary flex justify-between items-center w-full">
                                {language === 'ar' ? 'عنوان البريد (Subject)' : 'Email Subject'}
                                <Button size="sm" variant="ghost" onClick={() => handleCopy(result.subject)}><Copy className="w-4 h-4" /></Button>
                            </Label>
                            <Input value={result.subject} readOnly className="bg-muted font-bold" />
                        </div>
                        
                        <div className="space-y-2 relative border border-border rounded-lg overflow-hidden flex flex-col">
                            <div className="bg-muted px-4 py-2 border-b flex justify-between items-center">
                                <Label className="text-primary m-0">{language === 'ar' ? 'محتوى البريد (HTML)' : 'Email Content (HTML)'}</Label>
                                <Button size="sm" variant="ghost" className="h-8" onClick={() => handleCopy(result.content)}><Copy className="w-4 h-4" /></Button>
                            </div>
                            <div className="p-4 bg-white dark:bg-black overflow-auto max-h-[300px]" dir="auto">
                                <div dangerouslySetInnerHTML={{ __html: result.content }} />
                            </div>
                            <div className="bg-muted px-4 py-2 border-t text-xs text-muted-foreground flex justify-between items-center">
                                <span>{language === 'ar' ? 'يمكنك نسخ الكود واستخدامه في أدوات إرسال البريد.' : 'You can copy the code and use it in email tools.'}</span>
                                <Button size="sm" variant="link" className="h-auto p-0" onClick={() => handleCopy(result.content)}>{language === 'ar' ? 'نسخ كود HTML' : 'Copy HTML Code'}</Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
