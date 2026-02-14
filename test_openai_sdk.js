const OpenAI = require('openai');

const apiKey = process.env.GEMINI_API_KEY;

const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
});

async function main() {
    try {
        console.log('Testing OpenAI SDK with Gemini...');
        const completion = await openai.chat.completions.create({
            model: 'gemini-1.5-flash',
            messages: [
                { role: 'user', content: 'Hello, are you working?' }
            ],
            max_tokens: 10
        });
        console.log('Success:', completion.choices[0].message.content);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
