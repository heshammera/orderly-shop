'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { Megaphone, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface AIMarketingAssistantProps {
    storeId: string;
}

export function AIMarketingAssistant({ storeId }: AIMarketingAssistantProps) {
    const { language } = useLanguage();
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [platform, setPlatform] = useState('facebook');
    const [tone, setTone] = useState('professional');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchProducts = async () => {
            const { data } = await supabase
                .from('products')
                .select('id, name, price, description')
                .eq('store_id', storeId)
                .eq('status', 'active');
            if (data) setProducts(data);
        };
        fetchProducts();
    }, [storeId]);

    const handleGenerate = async () => {
        if (!selectedProductId) {
            toast.error(language === 'ar' ? 'الرجاء اختيار منتج' : 'Please select a product');
            return;
        }

        setLoading(true);
        try {
            const product = products.find(p => p.id === selectedProductId);
            
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate-campaign',
                    storeId,
                    products: [product],
                    platform,
                    campaignTone: tone
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                setResult(data.data);
                toast.success(language === 'ar' ? 'تم إنشاء الحملة بنجاح!' : 'Campaign generated successfully!');
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
                    <Megaphone className="w-5 h-5 text-blue-500" />
                    <CardTitle>{language === 'ar' ? 'مساعد الحملات التسويقية' : 'Marketing Assistant'}</CardTitle>
                </div>
                <CardDescription>
                    {language === 'ar' 
                        ? 'اختر منتجاً ودع الذكاء الاصطناعي يكتب إعلاناً جاهزاً لوسائل التواصل الاجتماعي.' 
                        : 'Select a product and let AI write a ready-to-use social media ad.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>{language === 'ar' ? 'المنتج' : 'Product'}</Label>
                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                            <SelectTrigger>
                                <SelectValue placeholder={language === 'ar' ? 'اختر منتجاً...' : 'Select product...'} />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map(p => {
                                    const name = typeof p.name === 'string' ? JSON.parse(p.name)[language] : p.name?.[language];
                                    return <SelectItem key={p.id} value={p.id}>{name || 'Unnamed'}</SelectItem>;
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>{language === 'ar' ? 'المنصة' : 'Platform'}</Label>
                        <Select value={platform} onValueChange={setPlatform}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="facebook">Facebook</SelectItem>
                                <SelectItem value="instagram">Instagram</SelectItem>
                                <SelectItem value="tiktok">TikTok</SelectItem>
                                <SelectItem value="snapchat">Snapchat</SelectItem>
                                <SelectItem value="twitter">X (Twitter)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>{language === 'ar' ? 'النبرة' : 'Tone'}</Label>
                        <Select value={tone} onValueChange={setTone}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="professional">{language === 'ar' ? 'احترافي ومقنع' : 'Professional'}</SelectItem>
                                <SelectItem value="emotional">{language === 'ar' ? 'عاطفي ومؤثر' : 'Emotional'}</SelectItem>
                                <SelectItem value="exciting">{language === 'ar' ? 'حماسي ومثير' : 'Exciting'}</SelectItem>
                                <SelectItem value="humorous">{language === 'ar' ? 'فكاهي' : 'Humorous'}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Button onClick={handleGenerate} disabled={loading} className="w-full">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {language === 'ar' ? 'إنشاء الإعلان' : 'Generate Ad'}
                </Button>

                {result && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="bg-muted p-4 rounded-lg space-y-2 relative">
                            <Label className="text-primary flex justify-between items-center w-full">
                                {language === 'ar' ? 'نص الإعلان:' : 'Ad Copy:'}
                                <Button size="sm" variant="ghost" onClick={() => handleCopy(result.ad_copy)}><Copy className="w-4 h-4" /></Button>
                            </Label>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{result.ad_copy}</p>
                        </div>
                        
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                            <Label className="text-primary flex justify-between items-center w-full">
                                {language === 'ar' ? 'الجمهور المستهدف:' : 'Target Audience:'}
                                <Button size="sm" variant="ghost" onClick={() => handleCopy(result.target_audience)}><Copy className="w-4 h-4" /></Button>
                            </Label>
                            <p className="text-sm">{result.target_audience}</p>
                        </div>

                        <div className="bg-muted p-4 rounded-lg space-y-2">
                            <Label className="text-primary flex justify-between items-center w-full">
                                {language === 'ar' ? 'الهاشتاقات المقترحة:' : 'Suggested Hashtags:'}
                                <Button size="sm" variant="ghost" onClick={() => handleCopy(result.hashtags?.join(' '))}><Copy className="w-4 h-4" /></Button>
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {result.hashtags?.map((tag: string, i: number) => (
                                    <span key={i} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                                        {tag.startsWith('#') ? tag : `#${tag}`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
