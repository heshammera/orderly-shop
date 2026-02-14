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

console.log('Testing Gemini API...');
console.log(`Hostname: ${options.hostname}`);
console.log(`Path: ${options.path}`);

const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);

    let chunks = [];
    res.on('data', (d) => {
        chunks.push(d);
    });

    res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        console.log('Response body:', body);
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error);
});

req.write(data);
req.end();
