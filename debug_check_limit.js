
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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugLimit() {
    const logFile = 'debug_log.txt';
    fs.writeFileSync(logFile, ''); // Clear file

    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + '\n');
    };

    log('Fetching stores...');
    // SELECT * to get all columns including has_unlimited_balance
    const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('*');

    if (storesError) {
        log('Error fetching stores: ' + JSON.stringify(storesError));
        return;
    }

    log(`Found ${stores.length} stores.`);

    for (const store of stores) {
        const isBalanceLow = (store.balance || 0) <= 0 && !store.has_unlimited_balance;

        // Call RPC
        const { data: usage, error: usageError } = await supabase
            .rpc('get_store_plan_usage', { p_store_id: store.id });

        if (usageError) {
            log(`Store ${store.name}: RPC Error: ` + JSON.stringify(usageError));
            continue;
        }

        const limit = Number(usage?.limit ?? 0);
        const currentUsage = Number(usage?.usage ?? 0);

        let isOverLimit = false;

        // Mirrors the logic in OrdersTable.tsx
        if (limit === -1) {
            isOverLimit = false;
        } else if (limit === 0 || currentUsage >= limit) {
            isOverLimit = true;
        }

        const shouldRestrict = isBalanceLow && isOverLimit;

        log(`--------------------------------------------------`);
        log(`Store: ${typeof store.name === 'string' ? store.name : 'Unknown'}`);
        log(`ID: ${store.id}`);
        log(`Balance: ${store.balance}`);
        log(`Unlimited Balance Column: ${store.has_unlimited_balance}`); // Should be boolean now
        log(`Plan Name: ${JSON.stringify(usage.plan_name)}`);
        log(`RPC Limit: ${limit}`);
        log(`RPC Usage: ${currentUsage}`);
        log(`Calculated Logic:`);
        log(`  isBalanceLow: ${isBalanceLow}`);
        log(`  isOverLimit: ${isOverLimit} (limit=${limit})`);
        log(`  shouldRestrict: ${shouldRestrict}`);
        log(`--------------------------------------------------`);
    }
}

debugLimit();
