import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) { console.error(error); return; }

    // Sort by created_at desc
    const sorted = users.users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    for (const u of sorted.slice(0, 3)) {
        console.log('User:', u.email, 'Meta:', u.user_metadata);
    }

    const { data: stores } = await supabase.from('stores').select('id, name, slug, status, balance, referral_code, referred_by_store_id').order('created_at', { ascending: false }).limit(3);
    console.log('\nStores:', stores);

    if (stores && stores.length > 0) {
        const { data: txs } = await supabase.from('wallet_transactions').select('*').eq('store_id', stores[0].id);
        console.log('\nWallet TXs for latest store:', txs);
    }
}
check();
