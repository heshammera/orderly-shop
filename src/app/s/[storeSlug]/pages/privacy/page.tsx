import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';

interface PrivacyPolicyPageProps {
    params: {
        storeSlug: string;
    };
}

export default async function PrivacyPolicyPage({ params }: PrivacyPolicyPageProps) {
    const supabase = createAdminClient();

    const { data: store, error } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', params.storeSlug)
        .single();

    if (error || !store) {
        notFound();
    }

    // Default to the language logic if needed, but since this is a server component 
    // without a language cookie context, we will render both or let the client handle it.
    // For SEO & simplicity, we can render the text and let CSS or basic logic handle direction.
    // A better approach is to access the language cookie if possible, but let's just 
    // display a clean reading view.

    const privacyPolicyAr = store.settings?.privacy_policy?.ar;
    const privacyPolicyEn = store.settings?.privacy_policy?.en;

    // If no policy exists at all, maybe they haven't set it yet
    const hasPolicy = !!(privacyPolicyAr || privacyPolicyEn);

    return (
        <>
            <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 min-h-[60vh]">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-4">
                        Privacy Policy / سياسة الخصوصية
                    </h1>
                </div>

                <div className="bg-card rounded-2xl shadow-sm border p-8 sm:p-12">
                    {hasPolicy ? (
                        <div className="space-y-12">
                            {privacyPolicyAr && (
                                <div dir="rtl" className="prose dark:prose-invert max-w-none text-right font-arabic">
                                    <div className="whitespace-pre-wrap leading-relaxed text-lg">
                                        {privacyPolicyAr}
                                    </div>
                                </div>
                            )}

                            {privacyPolicyAr && privacyPolicyEn && (
                                <hr className="border-border opacity-50" />
                            )}

                            {privacyPolicyEn && (
                                <div dir="ltr" className="prose dark:prose-invert max-w-none text-left">
                                    <div className="whitespace-pre-wrap leading-relaxed text-lg">
                                        {privacyPolicyEn}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-12">
                            <p>This store has not published a privacy policy yet.</p>
                            <p dir="rtl" className="mt-2">لم يقم هذا المتجر بنشر سياسة الخصوصية بعد.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
