import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper to get the correct Gemini model instance based on provided or fallback API key
function getModel(merchantApiKey?: string) {
    const key = merchantApiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!key || key === 'your_openai_api_key_here' || key === 'your_gemini_api_key_here') {
        throw new Error('Gemini API Key is not configured.');
    }
    
    const genAI = new GoogleGenerativeAI(key);
    // Using flash model for speed and cost efficiency
    return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

export const AIService = {
    async generateProductContent(name: string, keywords?: string, category?: string, tone: string = 'professional', apiKey?: string) {
        const model = getModel(apiKey);

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

    async generateSEO(name: string, description: string, apiKey?: string) {
        const model = getModel(apiKey);

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

    async translateContent(text: string, targetLang: 'ar' | 'en', apiKey?: string) {
        const model = getModel(apiKey);

        const prompt = `Translate the following text to ${targetLang === 'ar' ? 'Arabic' : 'English'}.
        Ensure the tone remains professional and suitable for e-commerce.
        Text: ${text}`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    },

    async generateMarketingCampaign(products: any[], platform: string, tone: string, apiKey?: string) {
        const model = getModel(apiKey);

        const productsText = products.map(p => `- ${p.name_ar || p.name} (${p.price} USD): ${p.description_ar || p.description}`).join('\n');

        const prompt = `أنت خبير تسويق إلكتروني وصناعة محتوى.
        المنصة المستهدفة: ${platform}
        النبرة المطلوبة: ${tone}
        
        بناءً على المنتجات التالية:
        ${productsText}
        
        قم بكتابة حملة تسويقية متكاملة.
        يجب أن يكون الرد بتنسيق JSON (بدون markdown) كالتالي:
        {
            "ad_copy": "نص الإعلان الجذاب هنا مع الإيموجي المناسب، يجب أن يكون مناسباً لطبيعة منصة ${platform}",
            "target_audience": "وصف مفصل للجمهور المستهدف (العمر، الاهتمامات، السلوكيات)",
            "hashtags": ["هاشتاج1", "هاشتاج2", "هاشتاج3", "هاشتاج4", "هاشتاج5"]
        }`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        return JSON.parse(result.response.text());
    },

    async analyzeReviews(reviews: any[], apiKey?: string) {
        const model = getModel(apiKey);

        if (!reviews || reviews.length === 0) {
            return {
                satisfaction_score: 0,
                strengths: [],
                weaknesses: [],
                recommendations: ["لا توجد مراجعات كافية لتحليلها."]
            };
        }

        const reviewsText = reviews.map(r => `تقييم ${r.rating}/5: ${r.comment || 'بدون تعليق'}`).join('\n');

        const prompt = `أنت محلل جودة وتجربة عملاء لمتجر إلكتروني.
        قم بتحليل المراجعات التالية للعملاء واستخرج رؤى قابلة للتنفيذ.
        
        المراجعات:
        ${reviewsText}
        
        يجب أن يكون الرد بتنسيق JSON (بدون markdown) كالتالي:
        {
            "satisfaction_score": 85, // رقم من 0 إلى 100 يمثل نسبة الرضا العامة بناءً على التحليل
            "strengths": [
                { "point": "اسم نقطة القوة (مثال: جودة التغليف)", "percentage": 40 } // نسبة تكرار هذه النقطة في التعليقات الإيجابية
            ],
            "weaknesses": [
                { "point": "اسم نقطة الضعف (مثال: التأخر في التوصيل)", "percentage": 30 }
            ],
            "recommendations": ["توصية عملية 1", "توصية عملية 2", "توصية عملية 3"]
        }
        `;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        return JSON.parse(result.response.text());
    },

    async generateCustomerResponse(message: string, storeName: string, tone: string, apiKey?: string) {
        const model = getModel(apiKey);

        const prompt = `أنت وكيل خدمة عملاء محترف تعمل لدى متجر "${storeName}".
        رسالة العميل:
        "${message}"
        
        المطلوب كتابة رد مثالي على هذه الرسالة.
        النبرة المطلوبة: ${tone} (مثال: ودود، احترافي، اعتذار).
        
        يجب أن يكون الرد بتنسيق JSON (بدون markdown) كالتالي:
        {
            "response_ar": "الرد الاحترافي باللغة العربية",
            "response_en": "Professional response in English"
        }`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        return JSON.parse(result.response.text());
    },

    async generateEmail(type: string, data: any, apiKey?: string) {
        const model = getModel(apiKey);
        
        let typeDescription = "";
        switch (type) {
            case 'abandoned_cart': typeDescription = "رسالة استعادة سلة مهجورة (لتحفيز العميل على إكمال الشراء)"; break;
            case 'welcome': typeDescription = "رسالة ترحيب بعميل جديد (شكر وتقديم المتجر)"; break;
            case 'special_offer': typeDescription = "عرض خاص وخصم حصري"; break;
            case 'win_back': typeDescription = "استعادة عميل قديم لم يشتري منذ فترة"; break;
            default: typeDescription = "رسالة إخبارية";
        }

        const prompt = `أنت خبير في كتابة النشرات البريدية (Email Marketing) لزيادة المبيعات.
        الهدف: ${typeDescription}
        اسم المتجر: ${data.storeName || 'المتجر'}
        ${data.customerName ? `اسم العميل: ${data.customerName}` : ''}
        ${data.additionalInfo ? `معلومات إضافية: ${data.additionalInfo}` : ''}
        
        يجب أن يكون الرد بتنسيق JSON (بدون markdown) كالتالي:
        {
            "subject": "عنوان جذاب للبريد الإلكتروني",
            "content": "نص البريد الإلكتروني منسق بـ HTML (استخدم تاقات مثل <br>, <strong>, <p> وتجنب تصميم معقد جداً، اجعله نظيفاً ومقنعاً)"
        }`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        return JSON.parse(result.response.text());
    }
};
