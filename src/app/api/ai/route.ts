import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai/service'; // Assuming service is created here
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        // 1. Authentication Check
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Request
        const body = await request.json();
        const { action, ...params } = body;

        let result;

        switch (action) {
            case 'generate-product':
                const { productName, keywords, tone, category } = params;
                if (!productName) throw new Error('Product name is required');
                result = await AIService.generateProductContent(productName, keywords, category, tone);
                break;

            case 'generate-seo':
                const { name, description } = params;
                result = await AIService.generateSEO(name, description);
                break;

            case 'translate':
                const { text, targetLang } = params;
                result = await AIService.translateContent(text, targetLang);
                break;

            default:
                throw new Error('Invalid action');
        }

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        console.error('AI Service Error:', error);

        // Check for specific API errors
        if (error?.status === 401 || error?.status === 403) {
            return NextResponse.json(
                { error: 'Gemini API Key is invalid. Please check aistudio.google.com' },
                { status: error.status }
            );
        }

        if (error?.status === 404) {
            return NextResponse.json(
                { error: 'AI Model not found or not available for your API Key tier.' },
                { status: 404 }
            );
        }

        if (error?.status === 429 || error?.code === 'insufficient_quota') {
            return NextResponse.json(
                { error: 'AI usage quota exceeded. Please check your billing details.' },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'AI Service Failed' },
            { status: 500 }
        );
    }
}
