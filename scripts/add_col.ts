import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const fs = require('fs');
    const sql = fs.readFileSync('supabase/migrations/20260304000000_add_theme_metadata.sql', 'utf8');
    const { data, error } = await supabase.rpc('execute_sql', {
        query: sql
    });
    if (error) {
        console.error("Error executing add_theme_metadata SQL:", error);
    } else {
        console.log("Columns added successfully:", data);
    }
}

main();
