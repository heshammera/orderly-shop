import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { VideoPlayer } from '@/components/tutorials/VideoPlayer';
import Link from 'next/link';
import { ArrowRight, PlayCircle, Clock, Share2 } from 'lucide-react';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Metadata, ResolvingMetadata } from 'next';

type Props = {
    params: { slug: string }
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: tutorial } = await supabase
        .from('tutorials')
        .select(`title, description, thumbnail_url`)
        .eq('slug', params.slug)
        .eq('is_published', true)
        .single();

    return {
        title: `${tutorial?.title?.ar || 'شرح'} | Social Commerce Hub`,
        description: tutorial?.description?.ar || '',
        openGraph: {
            images: tutorial?.thumbnail_url ? [tutorial.thumbnail_url] : [],
        },
    };
}

export default async function PublicTutorialStandalonePage({ params }: Props) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    // Fetch tutorials visibility setting
    let tutorialsEnabled = true;
    try {
        const { data: settingData } = await supabase.rpc('get_setting', { setting_key: 'tutorials_enabled_landing' });
        if (settingData !== null && settingData !== undefined) {
            const val = String(settingData).replace(/"/g, '');
            tutorialsEnabled = val === 'true';
        }
    } catch (e) {
        console.error("Failed to fetch tutorials setting", e);
    }

    if (!tutorialsEnabled) {
        notFound();
    }

    // Fetch specific tutorial
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

    // Related tutorials
    let relatedTutorials: any[] = [];
    if (tutorial.category_id) {
        const { data: related } = await supabase
            .from('tutorials')
            .select('id, title, slug, thumbnail_url')
            .eq('category_id', tutorial.category_id)
            .eq('is_published', true)
            .neq('display_mode', 'standalone')
            .neq('id', tutorial.id)
            .limit(3);
        relatedTutorials = related || [];
    }

    const titleEn = tutorial.title?.en;
    const titleAr = tutorial.title?.ar || titleEn;
    const descEn = tutorial.description?.en;
    const descAr = tutorial.description?.ar || descEn;

    const catObj = Array.isArray(tutorial.category) ? tutorial.category[0] : tutorial.category;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl">
            <Header tutorialsEnabled={tutorialsEnabled} />

            <main className="flex-1 pt-24 pb-20">
                <div className="max-w-6xl mx-auto px-4 md:px-8">

                    {/* Back Link */}
                    <div className="mb-8">
                        <Link href="/tutorials" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors bg-white px-4 py-2 rounded-full shadow-sm hover:shadow-md border border-slate-100">
                            <ArrowRight className="w-4 h-4" />
                            العودة لجميع الشروحات
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-8 lg:gap-12">
                        {/* Main Content Area */}
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                            {/* Video Player Box */}
                            <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                                <VideoPlayer
                                    videoUrl={tutorial.video_url}
                                    videoType={tutorial.video_type}
                                    videoId={tutorial.video_id}
                                    thumbnailUrl={tutorial.thumbnail_url}
                                    title={titleAr}
                                    className="w-full h-auto aspect-video"
                                />
                            </div>

                            {/* Content Details */}
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        {catObj && (
                                            <span className="bg-primary/10 text-primary text-sm font-bold px-3 py-1 rounded-full">
                                                {catObj.name.ar}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(tutorial.created_at).toLocaleDateString('ar-EG')}</span>
                                        </div>
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
                                        {titleAr}
                                    </h1>
                                </div>

                                <hr className="border-slate-100" />

                                <div className="prose prose-slate prose-lg max-w-none">
                                    <p className="text-slate-600 leading-relaxed whitespace-pre-line text-lg">
                                        {descAr}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Related Content */}
                        {relatedTutorials.length > 0 && (
                            <aside className="space-y-6">
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 sticky top-28">
                                    <h3 className="font-extrabold text-xl text-slate-900 flex items-center gap-2 mb-6">
                                        <PlayCircle className="w-6 h-6 text-primary" />
                                        شروحات ذات صلة
                                    </h3>
                                    <div className="space-y-5">
                                        {relatedTutorials.map(rel => (
                                            <Link href={`/tutorials/${rel.slug}`} key={rel.id} className="group flex flex-col gap-3">
                                                <div className="relative w-full aspect-video bg-slate-100 rounded-xl overflow-hidden shadow-sm shadow-slate-200/50">
                                                    {rel.thumbnail_url ? (
                                                        <img src={rel.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                                            <PlayCircle className="w-8 h-8 text-white/50" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                                        <span className="text-white text-xs font-medium flex items-center gap-1">
                                                            <PlayCircle className="w-3 h-3" /> شاهد الآن
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                                        {rel.title?.ar || rel.title?.en}
                                                    </h4>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </aside>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
