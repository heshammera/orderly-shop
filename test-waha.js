const wahaUrl = process.env.WAHA_API_URL || 'https://waha-production-80e4.up.railway.app';
const wahaKey = process.env.WAHA_API_KEY || 'MySecretKey123!';

async function testWaha() {
    console.log('1. Checking WAHA Session Status...');
    try {
        const sessionRes = await fetch(`${wahaUrl}/api/sessions?all=true`, {
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': wahaKey
            }
        });
        const sessions = await sessionRes.json();
        console.log('Session Status:', JSON.stringify(sessions, null, 2));

        if (!sessions || sessions.length === 0 || sessions[0].status !== 'WORKING') {
            console.error('❌ Error: Default WAHA session is not WORKING. Please scan the QR code in WAHA dashboard.');
            return;
        }

        // Prompt for phone number or use a default one for testing
        // For testing, let's just make the user edit this file or we ask them.
        const testPhone = process.argv[2]; // Get phone from command line arg

        if (!testPhone) {
            console.log('\n⚠️ Please run the script with your phone number: node test-waha.js 9665XXXXXXXX');
            return;
        }

        const formattedPhone = testPhone.replace(/\D/g, '') + '@c.us';
        console.log(`\n2. Sending test message to ${formattedPhone}...`);

        const sendRes = await fetch(`${wahaUrl}/api/sendText`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Api-Key': wahaKey
            },
            body: JSON.stringify({
                session: 'default',
                chatId: formattedDestination,
                text: 'Orderly | أوردلي\n\nرسالة اختبار من النظام / System Test Message'
            })
        });

        const sendData = await sendRes.json();

        if (sendRes.ok) {
            console.log('✅ Send Response SUCCESS:', JSON.stringify(sendData, null, 2));
        } else {
            console.error('❌ Send Response FAILED:', sendRes.status, JSON.stringify(sendData, null, 2));
        }

    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

testWaha();
