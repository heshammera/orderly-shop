import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumn() {
    const { error } = await supabase.rpc('execute_sql', {
        sql: 'ALTER TABLE variant_options ADD COLUMN IF NOT EXISTS is_out_of_stock BOOLEAN DEFAULT false;'
    });

    if (error) {
        console.error('RPC failed, trying raw insertion via REST... error:', error.message);
        process.exit(1);
    }

    console.log('Column added successfully');
}

addColumn();
