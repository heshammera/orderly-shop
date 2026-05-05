import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { apiKey } = body;

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key is required' }, { status: 400 });
        }

        // Initialize Gemini client with the provided key
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Send a simple prompt to test the connection
        const result = await model.generateContent("Hi, are you there? Please reply with only 'yes'.");
        const text = result.response.text();

        if (text) {
            return NextResponse.json({ success: true, message: 'Connection successful' });
        } else {
            throw new Error('Empty response from Gemini');
        }

    } catch (error: any) {
        console.error('AI Test Key Error:', error);

        if (error?.status === 401 || error?.status === 403 || error?.message?.includes('API key not valid')) {
            return NextResponse.json(
                { error: 'مفتاح API غير صالح. يرجى التأكد من نسخه بشكل صحيح من Google AI Studio.' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'فشل الاتصال: ' + (error.message || 'خطأ غير معروف') },
            { status: 500 }
        );
    }
}
