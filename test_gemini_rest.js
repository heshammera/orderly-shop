const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

const data = JSON.stringify({
    model: 'gemini-1.5-flash',
    messages: [{ role: 'user', content: 'Say hello' }]
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: '/v1beta/openai/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    }
};

console.log('Testing Raw REST to Gemini OpenAI Compatibility...');
console.log(`URL: https://${options.hostname}${options.path}`);

const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);
    let chunks = [];
    res.on('data', (d) => chunks.push(d));
    res.on('end', () => console.log('Response:', Buffer.concat(chunks).toString()));
});

req.on('error', console.error);
req.write(data);
req.end();
