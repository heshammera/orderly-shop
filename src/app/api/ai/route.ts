import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai/service';
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
        const { action, storeId, ...params } = body;

        // 3. Fetch Store's API Key
        let merchantApiKey: string | undefined;
        if (storeId) {
            const { data: storeData } = await supabase
                .from('stores')
                .select('settings')
                .eq('id', storeId)
                .single();
            
            if (storeData && storeData.settings && storeData.settings.ai && storeData.settings.ai.gemini_api_key) {
                merchantApiKey = storeData.settings.ai.gemini_api_key;
            }
        }

        let result;

        switch (action) {
            case 'generate-product':
                const { productName, keywords, tone, category } = params;
                if (!productName) throw new Error('Product name is required');
                result = await AIService.generateProductContent(productName, keywords, category, tone, merchantApiKey);
                break;

            case 'generate-seo':
                const { name, description } = params;
                result = await AIService.generateSEO(name, description, merchantApiKey);
                break;

            case 'translate':
                const { text, targetLang } = params;
                result = await AIService.translateContent(text, targetLang, merchantApiKey);
                break;

            case 'generate-campaign':
                const { products, platform, campaignTone } = params;
                result = await AIService.generateMarketingCampaign(products, platform, campaignTone, merchantApiKey);
                break;

            case 'analyze-reviews':
                const { reviews } = params;
                result = await AIService.analyzeReviews(reviews, merchantApiKey);
                break;

            case 'generate-response':
                const { message, storeName, responseTone } = params;
                result = await AIService.generateCustomerResponse(message, storeName, responseTone, merchantApiKey);
                break;

            case 'generate-email':
                const { emailType, data } = params;
                result = await AIService.generateEmail(emailType, data, merchantApiKey);
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
                { error: 'Gemini API Key is invalid. Please check your AI settings.' },
                { status: error.status || 401 }
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
                { error: 'AI usage quota exceeded. Please check your AI API key billing details.' },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'AI Service Failed' },
            { status: 500 }
        );
    }
}
