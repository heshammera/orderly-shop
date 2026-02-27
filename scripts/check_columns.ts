import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products';"
    });

    if (error) {
        // Try the REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ sql_query: "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products';" }),
        });

        if (!response.ok) {
            // Use the PG Management API
            const pgResponse = await fetch(`${supabaseUrl}/pg`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({ query: "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products';" }),
            });
            const pgResult = await pgResponse.json();
            console.log('Columns:', JSON.stringify(pgResult));
        } else {
            console.log('Columns:', await response.json());
        }
    } else {
        console.log('Columns:', data);
    }
}
checkSchema();
