const wahaUrl = 'https://waha-production-80e4.up.railway.app/api/sendText';
const wahaKey = 'MySecretKey123!';

const payload = {
    session: 'default',
    chatId: '966500000000@c.us', // Replace with a real number
    text: 'Test message directly from WAHA API'
};

fetch(wahaUrl, {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Api-Key': wahaKey
    },
    body: JSON.stringify(payload)
})
    .then(res => res.json())
    .then(data => console.log(JSON.stringify(data, null, 2)))
    .catch(console.error);
