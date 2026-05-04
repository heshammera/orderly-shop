const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getTrigger() {
    const { data, error } = await supabase.rpc('get_function_def', { function_name: 'handle_new_user' });
    if (error) {
        // If RPC doesn't exist, we can use raw sql via a temp table or just use postgres connection if we had one.
        // Wait, supabase-js doesn't support raw SQL. 
        console.log('Cant use RPC', error);
    } else {
        console.log(data);
    }
}
getTrigger();
