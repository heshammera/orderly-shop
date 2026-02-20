const payload = {
    code: "123456",
    method: "whatsapp",
    destination: "+966555555555",
    userName: "Test User",
    expiresIn: 5
};

fetch('https://n8n-production-f908.up.railway.app/webhook/otp-send', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': 'orderly_otp_secret_2024'
    },
    body: JSON.stringify(payload)
}).then(res => res.text()).then(console.log).catch(console.error);
