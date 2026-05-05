'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { BarChart, Loader2, ThumbsUp, ThumbsDown, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface AIReviewsAnalyzerProps {
    storeId: string;
}

export function AIReviewsAnalyzer({ storeId }: AIReviewsAnalyzerProps) {
    const { language } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [reviewCount, setReviewCount] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        const fetchReviewCount = async () => {
            // Simplified: Counting reviews for this store's products
            const { count } = await supabase
                .from('product_reviews')
                .select('*', { count: 'exact', head: true })
                // Assuming we have a way to filter by store. If not, we fetch all and filter, or use an RPC.
                // For this example, let's just pretend we get the count of all reviews for the store's products.
                // The actual fetch is done in the API route, we just need to indicate there are reviews.
            setReviewCount(count || 0); // Mocked or just showing 0 if no direct store_id exists on reviews
        };
        // fetchReviewCount();
    }, [storeId]);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            // Fetch reviews from DB
            const { data: products } = await supabase.from('products').select('id').eq('store_id', storeId);
            if (!products || products.length === 0) {
                toast.error(language === 'ar' ? 'لا توجد منتجات في المتجر' : 'No products found');
                return;
            }
            const productIds = products.map(p => p.id);
            const { data: reviews } = await supabase
                .from('product_reviews')
                .select('rating, comment')
                .in('product_id', productIds)
                .not('comment', 'is', null)
                .limit(50); // limit to recent 50 for analysis

            if (!reviews || reviews.length === 0) {
                toast.error(language === 'ar' ? 'لا توجد مراجعات كافية لتحليلها' : 'Not enough reviews to analyze');
                return;
            }

            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'analyze-reviews',
                    storeId,
                    reviews
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                setResult(data.data);
                toast.success(language === 'ar' ? 'تم تحليل المراجعات!' : 'Reviews analyzed!');
            } else {
                throw new Error(data.error || 'Failed to analyze');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-indigo-500" />
                    <CardTitle>{language === 'ar' ? 'محلل المراجعات الذكي' : 'Reviews Analyzer'}</CardTitle>
                </div>
                <CardDescription>
                    {language === 'ar' 
                        ? 'يقوم الذكاء الاصطناعي بقراءة تعليقات العملاء واستخراج نقاط القوة والضعف بدقة.' 
                        : 'AI reads customer comments and extracts strengths and weaknesses accurately.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                <Button onClick={handleAnalyze} disabled={loading} className="w-full" variant="outline">
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <SparklesIcon className="w-4 h-4 mr-2" />}
                    {language === 'ar' ? 'تحليل المراجعات الآن' : 'Analyze Reviews Now'}
                </Button>

                {result && (
                    <div className="space-y-6 pt-4 border-t animate-in fade-in slide-in-from-bottom-4">
                        
                        {/* Satisfaction Score */}
                        <div className="space-y-2 text-center">
                            <h3 className="text-3xl font-bold text-primary">{result.satisfaction_score}%</h3>
                            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'نسبة رضا العملاء العامة' : 'Overall Customer Satisfaction'}</p>
                            <Progress value={result.satisfaction_score} className="h-2 w-full max-w-md mx-auto" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Strengths */}
                            <div className="space-y-3 bg-green-50/50 dark:bg-green-950/20 p-4 rounded-xl border border-green-100 dark:border-green-900/50">
                                <h4 className="font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                                    <ThumbsUp className="w-4 h-4" />
                                    {language === 'ar' ? 'أبرز نقاط القوة' : 'Key Strengths'}
                                </h4>
                                <ul className="space-y-3">
                                    {result.strengths?.map((s: any, i: number) => (
                                        <li key={i} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span>{s.point}</span>
                                                <span className="text-green-600 font-medium">{s.percentage}%</span>
                                            </div>
                                            <Progress value={s.percentage} className="h-1.5 [&>div]:bg-green-500" />
                                        </li>
                                    ))}
                                    {(!result.strengths || result.strengths.length === 0) && (
                                        <p className="text-sm text-muted-foreground">{language === 'ar' ? 'لا توجد بيانات' : 'No data'}</p>
                                    )}
                                </ul>
                            </div>

                            {/* Weaknesses */}
                            <div className="space-y-3 bg-red-50/50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50">
                                <h4 className="font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                                    <ThumbsDown className="w-4 h-4" />
                                    {language === 'ar' ? 'أبرز نقاط الضعف' : 'Key Weaknesses'}
                                </h4>
                                <ul className="space-y-3">
                                    {result.weaknesses?.map((w: any, i: number) => (
                                        <li key={i} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span>{w.point}</span>
                                                <span className="text-red-600 font-medium">{w.percentage}%</span>
                                            </div>
                                            <Progress value={w.percentage} className="h-1.5 [&>div]:bg-red-500" />
                                        </li>
                                    ))}
                                    {(!result.weaknesses || result.weaknesses.length === 0) && (
                                        <p className="text-sm text-muted-foreground">{language === 'ar' ? 'لا توجد بيانات' : 'No data'}</p>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50 space-y-3">
                            <h4 className="font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4" />
                                {language === 'ar' ? 'توصيات عملية من الذكاء الاصطناعي' : 'AI Recommendations'}
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-amber-900 dark:text-amber-200">
                                {result.recommendations?.map((rec: string, i: number) => (
                                    <li key={i}>{rec}</li>
                                ))}
                            </ul>
                        </div>

                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function SparklesIcon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
        </svg>
    )
}
