import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillSyncedOrders() {
    console.log('Starting backfill for synced orders...');

    // 1. Fetch all store integrations that are currently active for google_sheets
    const { data: integrations, error } = await supabase
        .from('store_integrations')
        .select('*')
        .eq('provider', 'google_sheets');

    if (error) {
        console.error('Failed to fetch integrations:', error);
        return;
    }

    if (!integrations || integrations.length === 0) {
        console.log('No active Google Sheets integrations found.');
        return;
    }

    const allSyncedOrderNumbers = new Set<string>();

    // 2. Iterate through integrations to fetch rows
    for (const integration of integrations) {
        const storeId = integration.store_id;
        console.log(`Processing integration for store: ${storeId}`);

        // Get Service Account credentials from the store settings
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('settings')
            .eq('id', storeId)
            .single();

        if (storeError || !store) {
            console.error(`Failed to fetch store settings for ${storeId}`);
            continue;
        }

        let serviceAccount = store.settings?.integrations?.google_service_account;
        if (!serviceAccount) {
            console.log(`No service account found for store ${storeId}`);
            continue;
        }

        if (typeof serviceAccount === 'string') {
            try {
                serviceAccount = JSON.parse(serviceAccount);
            } catch (e) {
                console.error(`Failed to parse serviceAccount JSON for store ${storeId}`);
                continue;
            }
        }

        const config = integration.config as any;
        const sheetId = config.sheet_id;
        const tabName = config.tab_name || 'Sheet1';

        try {
            // Setup Google API Auth
            const auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: serviceAccount.client_email,
                    private_key: serviceAccount.private_key,
                },
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            const sheets = google.sheets({ version: 'v4', auth });

            // Fetch Column A (assuming Order Number is in Column A)
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: `${tabName}!A:A`,
            });

            const rows = response.data.values;
            if (rows && rows.length > 0) {
                // Collect unique order numbers
                rows.forEach((row, index) => {
                    if (index === 0 && row[0]?.toLowerCase().includes('order')) return; // skip header
                    const orderNumber = row[0];
                    if (orderNumber) {
                        allSyncedOrderNumbers.add(orderNumber.trim());
                    }
                });
                console.log(`Found ${rows.length} rows in sheet ${sheetId}`);
            }
        } catch (e: any) {
            console.error(`Error reading from sheet ${sheetId}:`, e.message);
        }
    }

    if (allSyncedOrderNumbers.size === 0) {
        console.log('No order numbers found in any Google Sheets.');
        return;
    }

    const orderNumbersArray = Array.from(allSyncedOrderNumbers);
    console.log(`Total unique synced orders found in sheets: ${orderNumbersArray.length}`);

    // Update database in chunks to avoid large query errors
    const chunkSize = 100;
    let totalUpdated = 0;

    for (let i = 0; i < orderNumbersArray.length; i += chunkSize) {
        const chunk = orderNumbersArray.slice(i, i + chunkSize);

        const { error: updateError } = await supabase
            .from('orders')
            .update({ is_synced: true })
            .in('order_number', chunk)
            .eq('is_synced', false); // Only update those that aren't already marked

        if (updateError) {
            console.error(`Failed to update chunk starting at index ${i}:`, updateError);
        } else {
            console.log(`Successfully updated batch (size: ${chunk.length})`);
            totalUpdated += chunk.length;
        }
    }

    console.log(`✅ Backfill complete! Marked orders as synced.`);
}

backfillSyncedOrders().catch(console.error);
