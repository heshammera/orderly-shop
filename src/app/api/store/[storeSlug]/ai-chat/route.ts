import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest, { params }: { params: { storeSlug: string } }) {
    try {
        const { storeSlug } = params;
        const body = await request.json();
        const { message, history } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

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

        // 1. Get Store and Settings
        const { data: store } = await supabase
            .from('stores')
            .select('id, name, settings, currency')
            .eq('slug', storeSlug)
            .single();

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        const apiKey = store.settings?.ai?.gemini_api_key;
        if (!apiKey) {
            return NextResponse.json({ error: 'AI not configured for this store' }, { status: 400 });
        }

        // 2. Get Store Products (for context)
        const { data: products } = await supabase
            .from('products')
            .select('id, name, description, price, sale_price, stock_quantity')
            .eq('store_id', store.id)
            .eq('status', 'active');

        const storeName = typeof store.name === 'string' ? JSON.parse(store.name).ar : store.name?.ar || 'المتجر';
        
        let productsContext = "المنتجات المتاحة حالياً في المتجر:\n";
        if (products && products.length > 0) {
            products.slice(0, 30).forEach(p => {
                const pName = typeof p.name === 'string' ? JSON.parse(p.name).ar : p.name?.ar;
                const pDesc = typeof p.description === 'string' ? JSON.parse(p.description).ar : p.description?.ar;
                const price = p.sale_price || p.price;
                const stock = p.stock_quantity > 0 ? 'متوفر' : 'غير متوفر';
                productsContext += `- ${pName} (${price} ${store.currency}): ${pDesc?.substring(0, 50)}... [${stock}]\n`;
            });
        } else {
            productsContext += "لا توجد منتجات معروضة حالياً.\n";
        }

        // 3. Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const systemInstruction = `أنت المساعد الذكي لمتجر "${storeName}". 
مهمتك هي مساعدة المتسوقين والرد على استفساراتهم بناءً على قائمة المنتجات المتاحة فقط.
لا تقترح منتجات من خارج المتجر أبداً.
تحدث بأسلوب ودود ومحترم وقصير.
إذا سأل العميل عن منتج غير موجود، اعتذر بوضوح واقترح منتجات بديلة إن وجدت.
العملة المستخدمة: ${store.currency}

${productsContext}`;

        // Format history for Gemini API
        const formattedHistory = (history || []).map((msg: any) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: systemInstruction }] },
                { role: 'model', parts: [{ text: 'مرحباً، فهمت التعليمات. أنا جاهز.' }] },
                ...formattedHistory
            ]
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        return NextResponse.json({ success: true, reply: responseText });

    } catch (error: any) {
        console.error('AI Chat Error:', error);
        return NextResponse.json(
            { error: 'فشل في الاتصال بالمساعد الذكي' },
            { status: 500 }
        );
    }
}
