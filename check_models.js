const https = require('https');

const options = {
    hostname: 'api.x.ai',
    port: 443,
    path: '/v1/models',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer ' + process.env.GROK_API_KEY
    }
};

const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.end();
