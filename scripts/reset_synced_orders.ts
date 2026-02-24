import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetSyncedOrders() {
    console.log('Resetting all orders is_synced back to false...');

    // Just blanket update all orders to is_synced = false
    const { data, error } = await supabase
        .from('orders')
        .update({ is_synced: false })
        .eq('is_synced', true); // Only touch those that currently say true

    if (error) {
        console.error('Failed to reset synced orders:', error);
    } else {
        console.log('✅ Successfully reset all is_synced true flags back to false.');
    }
}

resetSyncedOrders().catch(console.error);
