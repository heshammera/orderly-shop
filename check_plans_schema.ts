
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlansTable() {
    const { data, error } = await supabase
        .from('plans')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching plans:', error);
    } else if (data && data.length > 0) {
        console.log('Columns in plans table:', Object.keys(data[0]));
        console.log('Sample data:', data[0]);
    } else {
        console.log('Plans table is empty or could not be queried.');
    }
}

checkPlansTable();
