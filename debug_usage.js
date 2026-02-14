
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env
try {
    const envPath = path.resolve(__dirname, '.env');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
} catch (e) {
    console.error('Error reading .env file', e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUsage() {
    console.log('Fetching stores...');
    // 1. Get all stores
    const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('*');

    if (storesError) {
        console.error('Error fetching stores:', storesError);
        return;
    }

    console.log(`Found ${stores.length} stores.`);

    for (const store of stores) {
        const isBalanceLow = (store.balance || 0) <= 0 && !store.has_unlimited_balance;

        // 2. Call RPC
        const { data: usage, error: usageError } = await supabase
            .rpc('get_store_plan_usage', { p_store_id: store.id });

        if (usageError) {
            console.log(`Store ${store.name}: Error fetching usage`, usageError);
            continue;
        }

        const limit = Number(usage?.limit ?? 0);
        const currentUsage = Number(usage?.usage ?? 0);

        let isOverLimit = false;

        // Strict check: If limit is 0, or usage exceeds limit
        if (limit === 0 || currentUsage >= limit) {
            isOverLimit = true;
        }

        const shouldRestrict = isBalanceLow && isOverLimit;

        console.log(`--------------------------------------------------`);
        console.log(`Store: ${typeof store.name === 'string' ? store.name : 'Unknown'}`);
        console.log(`ID: ${store.id}`);
        console.log(`Balance: ${store.balance}, Unlimited? ${store.has_unlimited_balance}`);
        console.log(`RPC Result:`, JSON.stringify(usage));
        console.log(`Plan Limit: ${limit}, Current Usage: ${currentUsage}`);
        console.log(`Logic: limit===0 (${limit === 0}) || usage>=limit (${currentUsage >= limit}) => isOverLimit: ${isOverLimit}`);
        console.log(`RESTRICTED: ${shouldRestrict}`);

    }
}

debugUsage();
