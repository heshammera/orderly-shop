import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Video, PlayCircle } from 'lucide-react';
import { TutorialCard } from '@/components/tutorials/TutorialCard';

export default async function DashboardTutorialsPage({ params }: { params: { storeId: string } }) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    // 1. Check if tutorials are enabled for dashboard globally
    const { data: settingData } = await supabase.rpc('get_setting', { setting_key: 'tutorials_enabled_dashboard' });
    if (settingData !== 'true' && settingData !== true) {
        redirect(`/dashboard/${params.storeId}`);
    }

    // 2. Fetch published tutorials
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
        // Filter out standalone-only from listing
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
        <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-slate-800">الشروحات والدلائل</h1>
                <p className="text-muted-foreground mt-1 text-sm">تعلم كيفية إدارة متجرك والوصول لأقصى استفادة من المنصة</p>
            </div>

            {!hasAnyContent ? (
                <div className="text-center py-20 border border-dashed rounded-xl bg-slate-50">
                    <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">لا توجد شروحات متاحة حالياً</h3>
                    <p className="text-slate-500 mt-2">سيتم إضافة الفيديوهات التعليمية قريباً</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {Object.entries(categorizedTutorials).map(([catId, group]) => (
                        <section key={catId} className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <PlayCircle className="w-5 h-5 text-primary" />
                                {group.categoryName.ar || group.categoryName.en}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {group.items.map(tutorial => (
                                    <TutorialCard
                                        key={tutorial.id}
                                        tutorial={tutorial}
                                        baseHref={`/dashboard/${params.storeId}/tutorials`}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}

                    {uncategorizedItems.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <PlayCircle className="w-5 h-5 text-primary" />
                                شروحات عامة
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {uncategorizedItems.map(tutorial => (
                                    <TutorialCard
                                        key={tutorial.id}
                                        tutorial={tutorial}
                                        baseHref={`/dashboard/${params.storeId}/tutorials`}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
