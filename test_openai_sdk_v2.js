const OpenAI = require('openai');

const apiKey = process.env.GEMINI_API_KEY;

const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
});

async function main() {
    try {
        console.log('Testing OpenAI SDK with Gemini (Model: models/gemini-1.5-flash)...');
        const completion = await openai.chat.completions.create({
            model: 'models/gemini-1.5-flash',
            messages: [
                { role: 'user', content: 'Hello' }
            ],
            max_tokens: 10
        });
        console.log('Success:', completion.choices[0].message.content);
    } catch (error) {
        console.error('Error Message:', error.message);
        console.error('Error Code:', error.code);
        console.error('Error Status:', error.status);
    }
}

main();
