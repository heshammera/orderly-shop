import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = 'https://iuggymtefgbunbiieosn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1Z2d5bXRlZmdidW5iaWllb3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQxOTY5OCwiZXhwIjoyMDg1OTk1Njk4fQ.4O0O44vhnlj4ROxamEk6owbUZmfX3mqvQay6sTHVpjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const out = {};
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (users) {
        const sorted = users.users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        out.latestUser = sorted.slice(0, 1)[0];
    }

    const { data: stores, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (stores && stores.length > 0) {
        out.latestStore = stores[0];
        const { data: txs } = await supabase.from('wallet_transactions').select('*').eq('store_id', stores[0].id);
        out.walletTxs = txs;

        const { data: sub } = await supabase.from('store_subscriptions').select('*').eq('store_id', stores[0].id);
        out.subscriptions = sub;
    }

    fs.writeFileSync('debug-out.json', JSON.stringify(out, null, 2), 'utf8');
}
run();
