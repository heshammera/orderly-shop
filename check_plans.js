
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

try {
    const envPath = path.resolve(__dirname, '.env');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
} catch (e) { }

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPlans() {
    const { data: plans, error } = await supabase.from('plans').select('id, name, limits');
    if (error) {
        console.error(error);
    } else {
        plans.forEach(p => {
            console.log(`ID: ${p.id}`);
            console.log(`Plan: ${JSON.stringify(p.name)}`);
            console.log(`Limits: ${JSON.stringify(p.limits)}`);
            console.log('---');
        });
    }
}

checkPlans();
