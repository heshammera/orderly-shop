const wahaUrl = 'https://waha-production-80e4.up.railway.app/api/sessions?all=true';
const wahaKey = 'MySecretKey123!';

fetch(wahaUrl, {
    headers: {
        'Accept': 'application/json',
        'X-Api-Key': wahaKey
    }
})
    .then(res => res.json())
    .then(data => console.log(JSON.stringify(data, null, 2)))
    .catch(console.error);
