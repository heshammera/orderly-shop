
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

try {
    const envPath = path.resolve(__dirname, '.env');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    });
} catch (e) { }

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    // Insert a dummy row if empty to get columns, or use a reliable method?
    // Postgres Rpc 'get_columns' might not exist.
    // Try selecting * limit 1.

    const { data, error } = await supabase.from('store_subscriptions').select('*').limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        if (data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        } else {
            console.log('Table is empty, cannot deduce columns from select *. Trying to insert dummy to see error? No that is dangerous.');
            console.log('Using error message from invalid select to find columns?');
            const { error: err2 } = await supabase.from('store_subscriptions').select('this_column_does_not_exist').limit(1);
            console.log('Error hint might help:', err2);
        }
    }
}

check();
