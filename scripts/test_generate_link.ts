import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGenerateLink() {
    // 1. Get an existing owner email
    const { data: stores } = await supabase
        .from('stores')
        .select('owner_id')
        .limit(1);

    if (!stores || stores.length === 0) {
        console.log('No stores found');
        return;
    }

    const ownerId = stores[0].owner_id;

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(ownerId);
    if (userError || !userData?.user) {
        console.error('Error fetching user:', userError);
        return;
    }

    const email = userData.user.email;
    console.log('Generating link for:', email);

    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
    });

    if (error) {
        console.error('Error generating link:', error);
    } else {
        console.log('Generated action link:', data.properties.action_link);
    }
}

testGenerateLink();
