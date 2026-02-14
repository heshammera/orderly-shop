const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

const data = JSON.stringify({
    model: 'gemini-1.5-flash',
    messages: [{ role: 'user', content: 'Say hello' }]
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    // Path for OpenAI compatibility is /v1beta/openai/chat/completions
    // But let's try just /v1beta/chat/completions just in case the SDK is doing something else
    path: '/v1beta/openai/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    }
};

// Update: Actually the OpenAI compatibility endpoint IS /v1beta/openai/chat/completions
// But the error 404 implies "Resource not found".
// Let's try to list models to see if the key works.

const listOptions = {
    hostname: 'generativelanguage.googleapis.com',
    path: '/v1beta/models?key=' + apiKey,
    method: 'GET',
};

console.log('Testing Gemini API (List Models)...');
const req = https.request(listOptions, (res) => {
    console.log(`statusCode: ${res.statusCode}`);
    let chunks = [];
    res.on('data', (d) => chunks.push(d));
    res.on('end', () => console.log('Models Response:', Buffer.concat(chunks).toString()));
});

req.on('error', console.error);
req.end();
