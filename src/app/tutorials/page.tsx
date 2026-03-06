import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Video, PlayCircle, BookOpen } from 'lucide-react';
import { TutorialCard } from '@/components/tutorials/TutorialCard';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';

export const metadata = {
    title: 'الشروحات والدلائل | Social Commerce Hub',
    description: 'تعلم كيفية استخدام المنصة وإدارة متجرك بنجاح من خلال شروحات الفيديو المختارة.',
};

export default async function PublicTutorialsPage() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    // Fetch published tutorials
    const { data: tutorials, error } = await supabase
        .from('tutorials')
        .select(`
            id, title, description, thumbnail_url, category_id, slug, display_mode, sort_order,
            category:category_id (name, sort_order)
        `)
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

    // Group tutorials by category
    const categorizedTutorials: Record<string, { categoryName: any, items: any[] }> = {};
    const uncategorizedItems: any[] = [];

    tutorials?.forEach(t => {
        // Filter out standalone-only
        if (t.display_mode === 'standalone') return;

        if (t.category) {
            const catId = t.category_id || 'other';
            const catObj = Array.isArray(t.category) ? t.category[0] : t.category;

            if (!categorizedTutorials[catId]) {
                categorizedTutorials[catId] = {
                    categoryName: catObj?.name || { ar: 'غير مصنف', en: 'Uncategorized' },
                    items: []
                };
            }
            categorizedTutorials[catId].items.push(t);
        } else {
            uncategorizedItems.push(t);
        }
    });

    const hasAnyContent = (tutorials?.filter(t => t.display_mode !== 'standalone').length || 0) > 0;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl">
            <Header />

            <main className="flex-1 pt-24 pb-20">
                {/* Hero section */}
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-primary/10 px-4 py-16 md:py-24 text-center">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm text-primary flex items-center justify-center mx-auto mb-6 ring-1 ring-primary/20">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                            مركز <span className="text-primary">الشروحات والدلائل</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                            مكتبة متكاملة من الفيديوهات التعليمية لمساعدتك في احتراف وإدارة متجرك الإلكتروني بكل سهولة.
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 md:mt-16">
                    {!hasAnyContent ? (
                        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                            <Video className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                            <h3 className="text-xl font-medium text-slate-900">لا توجد شروحات متاحة حالياً</h3>
                            <p className="text-slate-500 mt-2">سيتم إضافة الفيديوهات التعليمية قريباً</p>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {Object.entries(categorizedTutorials).map(([catId, group]) => (
                                <section key={catId} className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <PlayCircle className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900">
                                            {group.categoryName.ar}
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {group.items.map(tutorial => (
                                            <TutorialCard
                                                key={tutorial.id}
                                                tutorial={tutorial}
                                                baseHref="/tutorials"
                                            />
                                        ))}
                                    </div>
                                </section>
                            ))}

                            {uncategorizedItems.length > 0 && (
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                            <PlayCircle className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900">
                                            شروحات عامة
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {uncategorizedItems.map(tutorial => (
                                            <TutorialCard
                                                key={tutorial.id}
                                                tutorial={tutorial}
                                                baseHref="/tutorials"
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
