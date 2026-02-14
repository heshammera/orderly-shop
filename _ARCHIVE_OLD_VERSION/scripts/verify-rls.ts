
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../next-platform/.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyStorefrontAccess() {
    console.log('Verifying Storefront Public Access...');

    // 1. Fetch Stores
    console.log('1. Fetching stores (public)...');
    const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, name, slug')
        .eq('status', 'active')
        .limit(1);

    if (storesError) {
        console.error('❌ Failed to fetch stores:', storesError.message);
    } else if (stores && stores.length > 0) {
        console.log('✅ Stores fetched successfully:', stores.length, 'found');
    } else {
        console.warn('⚠️ No active stores found, but query succeeded.');
    }

    // 2. Fetch Products
    console.log('2. Fetching products (public)...');
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('status', 'active')
        .limit(1);

    if (productsError) {
        console.error('❌ Failed to fetch products:', productsError.message);
    } else {
        console.log('✅ Products fetched successfully:', products?.length || 0, 'found');
    }

    // 3. Test Customer Creation (Public) - Client Side ID Generation
    console.log('3. Testing Customer Creation (Public insert with client ID)...');

    // Generate UUID client-side (mocking crypto.randomUUID for node script if needed, or using web crypto if available in node 19+)
    // content of verification script runs in node. 
    const customerId = crypto.randomUUID();

    const customerData = {
        id: customerId,
        store_id: stores![0].id,
        name: 'RLS Test Customer',
        phone: '0555555555'
    };

    // Insert WITHOUT select
    const { error: custError } = await supabase
        .from('customers')
        .insert(customerData);

    if (custError) {
        console.error('❌ Failed to create customer:', custError.message);
    } else {
        console.log('✅ Customer created successfully (Client ID)');
    }

    // 4. Create Order (Simulate Checkout)
    if (stores && stores.length > 0) {
        const store = stores[0];
        console.log(`4. simulating order creation for store: ${store.slug}...`);

        const orderData = {
            store_id: store.id,
            customer_id: customerId, // Link to the customer we just created
            order_number: `TEST-${Date.now()}`,
            status: 'pending',
            subtotal: 100,
            total: 100,
            currency: 'SAR',
            customer_snapshot: { name: 'Test User', phone: '0500000000' }
        };

        // Try INSERT ONLY 
        const { error: insertError } = await supabase
            .from('orders')
            .insert(orderData);

        if (insertError) {
            console.error('❌ Failed to create order:', insertError.message);
        } else {
            console.log('✅ Order created successfully linked to Customer');
        }
    } else {
        console.log('Skipping order creation test due to no stores.');
    }
}

verifyStorefrontAccess();
