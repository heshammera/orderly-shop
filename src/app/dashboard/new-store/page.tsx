"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from '@/hooks/use-toast';

export default function CreateStorePage() {
    const { language } = useLanguage();
    const router = useRouter();
    const supabase = createClient();

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Basic Slug Validation (alphanumeric and hyphens)
            if (!/^[a-z0-9-]+$/.test(slug)) {
                throw new Error(language === 'ar' ? 'يجب أن يحتوي اسم الرابط على أحرف وأرقام وعلامات طرح فقط' : 'Slug must only contain lowercase letters, numbers, and hyphens');
            }

            // 2. Check Slug Availability
            const { data: existing } = await supabase
                .from('stores')
                .select('id')
                .eq('slug', slug)
                .maybeSingle();

            if (existing) {
                throw new Error(language === 'ar' ? 'هذا الرابط مستخدم بالفعل، يرجى اختيار رابط آخر' : 'This slug is already taken, please choose another');
            }

            // 3. Create Store via RPC
            const { data: storeId, error: rpcError } = await supabase.rpc('create_store', {
                p_name: name,
                p_slug: slug
            });

            if (rpcError) throw rpcError;

            toast({
                title: language === 'ar' ? 'تم إنشاء المتجر بنجاح' : 'Store Created Successfully',
                description: language === 'ar' ? 'يمكنك الآن البدء في إعداد متجرك الجديد' : 'You can now start setting up your new store.',
            });

            router.push(`/dashboard/${storeId}`);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[70vh] p-4">
            <Card className="w-full max-w-md shadow-lg border-0">
                <form onSubmit={handleSubmit}>
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Store className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            {language === 'ar' ? 'إنشاء متجر جديد' : 'Create New Store'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'ar'
                                ? 'أضف متجراً جديداً إلى حسابك وابدأ البيع فوراً'
                                : 'Add a new store to your account and start selling instantly'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        {error && (
                            <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>{language === 'ar' ? 'خطأ' : 'Error'}</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">
                                {language === 'ar' ? 'اسم المتجر' : 'Store Name'}
                            </Label>
                            <Input
                                id="name"
                                placeholder={language === 'ar' ? 'مثال: متجري للملابس' : 'e.g. My Clothing Store'}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">
                                {language === 'ar' ? 'رابط المتجر (Slug)' : 'Store Slug'}
                            </Label>
                            <div className="flex items-center group">
                                <Input
                                    id="slug"
                                    placeholder="my-store"
                                    className="rounded-e-none focus-visible:ring-0"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                                    required
                                    disabled={loading}
                                />
                                <div className="h-10 px-3 flex items-center bg-muted border border-s-0 rounded-e-md text-sm text-muted-foreground">
                                    .site.com
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground px-1">
                                {language === 'ar' ? 'أحرف إنجليزية صغيرة وأرقام وعلامة - فقط' : 'Lowercase, numbers, and hyphens only'}
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 pt-6">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    {language === 'ar' ? 'إنشاء المتجر' : 'Create Store'}
                                    <ArrowRight className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0" />
                                </>
                            )}
                        </Button>
                        <Button variant="ghost" className="w-full text-muted-foreground" asChild disabled={loading}>
                            <a href="/dashboard">
                                {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </a>
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
