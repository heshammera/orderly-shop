
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

try {
    const envPath = path.resolve(__dirname, '.env');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
} catch (e) { console.error(e); }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking stores columns...');
    const { data: storesCols, error: e1 } = await supabase
        .rpc('get_columns', { table_name: 'stores' })
    // Fallback if we don't have a helper RPC, just select * limit 0 and check object keys
    // But invalid column error prevents selecting *.
    // So let's try reading information_schema via RPC if possible, or just raw SQL if we could.
    // We can't run raw SQL.
    // Let's try to select * from stores limit 1 again and see the error in detail.

    // Actually, I can use the existing debug info.
    // The previous run said "Found 4 stores". So `stores` SELECT * worked!
    // So `has_unlimited_balance` might exist if it was in the * result.

    // Let's check `store_subscriptions`.
    console.log('Checking store_subscriptions query...');
    const { data: subs, error: subsError } = await supabase
        .from('store_subscriptions')
        .select('*')
        .limit(1);

    if (subsError) {
        console.error('store_subscriptions error:', subsError);
    } else {
        console.log('store_subscriptions columns:', subs && subs.length > 0 ? Object.keys(subs[0]) : 'Table empty');
    }

    // Check stores again explicitly
    const { data: st, error: stError } = await supabase
        .from('stores')
        .select('*')
        .limit(1);

    if (stError) console.error('stores error:', stError);
    else console.log('stores columns:', st && st.length > 0 ? Object.keys(st[0]) : 'Table empty');
}

checkSchema();
