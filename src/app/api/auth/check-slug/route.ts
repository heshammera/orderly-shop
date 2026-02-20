import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    try {
        const slug = request.nextUrl.searchParams.get('slug');

        if (!slug || slug.length < 3) {
            return NextResponse.json({ available: false, error: 'Slug must be at least 3 characters' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Check if slug exists
        const { data: existing, error } = await supabase
            .from('stores')
            .select('slug')
            .eq('slug', slug)
            .maybeSingle();

        if (error) {
            console.error('[check-slug] Error:', error);
            return NextResponse.json({ available: false, error: 'Failed to check slug' }, { status: 500 });
        }

        if (existing) {
            // Slug is taken — generate suggestions
            const suggestions: string[] = [];
            const suffixes = [
                `-${Math.floor(Math.random() * 99) + 1}`,
                '-store',
                '-shop',
                `-${new Date().getFullYear()}`,
                '-online',
            ];

            // Check which suggestions are available
            const candidateSlugs = suffixes.map(s => slug + s);
            const { data: takenSlugs } = await supabase
                .from('stores')
                .select('slug')
                .in('slug', candidateSlugs);

            const takenSet = new Set((takenSlugs || []).map((s: any) => s.slug));

            for (const candidate of candidateSlugs) {
                if (!takenSet.has(candidate) && suggestions.length < 3) {
                    suggestions.push(candidate);
                }
            }

            return NextResponse.json({
                available: false,
                suggestions,
            });
        }

        return NextResponse.json({ available: true });

    } catch (error) {
        console.error('[check-slug] Unexpected error:', error);
        return NextResponse.json({ available: false, error: 'Internal server error' }, { status: 500 });
    }
}
