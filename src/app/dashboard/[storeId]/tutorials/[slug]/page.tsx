import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { VideoPlayer } from '@/components/tutorials/VideoPlayer';
import Link from 'next/link';
import { ArrowRight, ChevronRight, PlayCircle } from 'lucide-react';

export default async function DashboardTutorialStandalonePage({
    params
}: {
    params: { storeId: string, slug: string }
}) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    // 1. Check if tutorials are enabled
    const { data: settingData } = await supabase.rpc('get_setting', { setting_key: 'tutorials_enabled_dashboard' });
    const val = settingData !== null && settingData !== undefined ? String(settingData).replace(/"/g, '') : 'true';
    if (val !== 'true') {
        redirect(`/dashboard/${params.storeId}`);
    }

    // 2. Fetch specific tutorial
    const { data: tutorial, error } = await supabase
        .from('tutorials')
        .select(`
            *,
            category:category_id (name)
        `)
        .eq('slug', params.slug)
        .eq('is_published', true)
        .single();

    if (error || !tutorial) {
        notFound();
    }

    // Related tutorials in the same category (if display mode allows listing or both)
    // Standalone only shouldn't necessarily hide them, but we only show listing/both in related
    let relatedTutorials: any[] = [];
    if (tutorial.category_id) {
        const { data: related } = await supabase
            .from('tutorials')
            .select('id, title, slug, thumbnail_url')
            .eq('category_id', tutorial.category_id)
            .eq('is_published', true)
            .neq('display_mode', 'standalone')
            .neq('id', tutorial.id)
            .limit(4);
        relatedTutorials = related || [];
    }

    const titleEn = tutorial.title?.en;
    const titleAr = tutorial.title?.ar || titleEn;
    const descEn = tutorial.description?.en;
    const descAr = tutorial.description?.ar || descEn;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 lg:space-y-8 animate-in fade-in duration-500">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center text-sm font-medium text-slate-500">
                <Link href={`/dashboard/${params.storeId}/tutorials`} className="hover:text-primary transition-colors hover:underline underline-offset-4">
                    الشروحات
                </Link>
                <ChevronRight className="w-4 h-4 mx-1 flex-shrink-0" />
                {tutorial.category && (
                    <>
                        <span className="text-slate-600">{tutorial.category.name.ar}</span>
                        <ChevronRight className="w-4 h-4 mx-1 flex-shrink-0" />
                    </>
                )}
                <span className="text-slate-900 truncate max-w-[200px] sm:max-w-xs block" title={titleAr}>{titleAr}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8">
                <div className="space-y-6">
                    {/* Video Player Section */}
                    <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                        <VideoPlayer
                            videoUrl={tutorial.video_url}
                            videoType={tutorial.video_type}
                            videoId={tutorial.video_id}
                            thumbnailUrl={tutorial.thumbnail_url}
                            title={titleAr}
                            className="w-full h-auto aspect-video"
                        />
                    </div>

                    {/* Video Details */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{titleAr}</h1>
                        <hr className="border-slate-100" />
                        <div className="prose prose-slate max-w-none">
                            <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">
                                {descAr}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Related Tutorials */}
                {relatedTutorials.length > 0 && (
                    <div className="space-y-4 w-full">
                        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                            <PlayCircle className="w-5 h-5 text-primary" />
                            فيديوهات ذات صلة
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                            {relatedTutorials.map(rel => (
                                <Link href={`/dashboard/${params.storeId}/tutorials/${rel.slug}`} key={rel.id} className="group flex gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors">
                                    <div className="relative w-32 aspect-video bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {rel.thumbnail_url ? (
                                            <img src={rel.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                                <PlayCircle className="w-6 h-6 text-white/50" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <PlayCircle className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 py-1">
                                        <h4 className="font-semibold text-sm text-slate-900 line-clamp-2 group-hover:text-primary transition-colors">
                                            {rel.title?.ar || rel.title?.en}
                                        </h4>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-8">
                <Link href={`/dashboard/${params.storeId}/tutorials`}>
                    <button className="flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                        العودة لقائمة الشروحات
                    </button>
                </Link>
            </div>
        </div>
    );
}
