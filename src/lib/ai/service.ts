import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

if (!apiKey || apiKey === 'your_openai_api_key_here') {
    console.warn('GEMINI_API_KEY is missing. AI features will not work.');
}

const genAI = new GoogleGenerativeAI(apiKey || 'dummy_key');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

export const AIService = {
    async generateProductContent(name: string, keywords?: string, category?: string, tone: string = 'professional') {
        if (!apiKey) {
            throw new Error('Gemini API Key is not configured.');
        }

        const systemPrompt = `أنت خبير في كتابة المحتوى التسويقي للمنتجات في التجارة الإلكترونية.
        مهمتك هي إنشاء محتوى جذاب وفعال بلغتين (العربية والإنجليزية).
        
        القواعد:
        - استخدم لغة عربية طبيعية وجذابة (ليست ترجمة حرفية)
        - ركز على الفوائد (Benefits) وليس المميزات فقط
        - اجعل الوصف قصيراً ومؤثراً (150-200 كلمة)
        - أدرج الكلمات المفتاحية بشكل طبيعي
        - الأسلوب: ${tone === 'luxury' ? 'فخم وراقي' : tone === 'friendly' ? 'ودود وبسيط' : 'احترافي ومقنع'}`;

        const userPrompt = `اكتب محتوى تسويقي لمنتج:
        الاسم: ${name}
        ${keywords ? `الكلمات المفتاحية: ${keywords}` : ''}
        ${category ? `الفئة: ${category}` : ''}
        
        يجب أن يتضمن الرد JSON بالشكل التالي (بدون markdown):
        {
          "title_ar": "عنوان جذاب بالعربية (20-30 حرف)",
          "title_en": "Catchy English Title (20-30 chars)",
          "description_ar": "وصف مفصل وجذاب بالعربية يبرز الفوائد",
          "description_en": "Detailed and catchy English description highlighting benefits",
          "seo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
        }`;

        const result = await model.generateContent({
            contents: [
                { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
            ],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        return JSON.parse(result.response.text());
    },

    async generateSEO(name: string, description: string) {
        if (!apiKey) {
            throw new Error('Gemini API Key is not configured');
        }

        const prompt = `Generate SEO metadata for a product.
        Product Name: ${name}
        Description: ${description}
        
        Return JSON format (no markdown):
        {
            "metaTitle": "SEO Title (50-60 chars)",
            "metaDescription": "SEO Description (150-160 chars)",
            "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
        }`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        return JSON.parse(result.response.text());
    },

    async translateContent(text: string, targetLang: 'ar' | 'en') {
        const prompt = `Translate the following text to ${targetLang === 'ar' ? 'Arabic' : 'English'}.
        Ensure the tone remains professional and suitable for e-commerce.
        Text: ${text}`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    }
};
