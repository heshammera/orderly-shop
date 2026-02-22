import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';

interface TermsOfServicePageProps {
    params: {
        storeSlug: string;
    };
}

export default async function TermsOfServicePage({ params }: TermsOfServicePageProps) {
    const supabase = createAdminClient();

    const { data: store, error } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', params.storeSlug)
        .single();

    if (error || !store) {
        notFound();
    }

    const termsAr = store.settings?.terms_of_service?.ar;
    const termsEn = store.settings?.terms_of_service?.en;

    const hasTerms = !!(termsAr || termsEn);

    return (
        <>
            <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 min-h-[60vh]">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-4">
                        Terms of Service / شروط الخدمة
                    </h1>
                </div>

                <div className="bg-card rounded-2xl shadow-sm border p-8 sm:p-12">
                    {hasTerms ? (
                        <div className="space-y-12">
                            {termsAr && (
                                <div dir="rtl" className="prose dark:prose-invert max-w-none text-right font-arabic">
                                    <div className="whitespace-pre-wrap leading-relaxed text-lg">
                                        {termsAr}
                                    </div>
                                </div>
                            )}

                            {termsAr && termsEn && (
                                <hr className="border-border opacity-50" />
                            )}

                            {termsEn && (
                                <div dir="ltr" className="prose dark:prose-invert max-w-none text-left">
                                    <div className="whitespace-pre-wrap leading-relaxed text-lg">
                                        {termsEn}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-12">
                            <p>This store has not published their terms of service yet.</p>
                            <p dir="rtl" className="mt-2">لم يقم هذا المتجر بنشر شروط الخدمة بعد.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
