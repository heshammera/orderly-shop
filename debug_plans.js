const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iuggymtefgbunbiieosn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1Z2d5bXRlZmdidW5iaWllb3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTk2OTgsImV4cCI6MjA4NTk5NTY5OH0.uuhnSlFopQcB68hkcBBf_YRod4DT7E5NYDi1CAv2qvY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlans() {
    const { data, error } = await supabase
        .from('plans')
        .select('id, slug, name_ar, display_features');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

checkPlans();
