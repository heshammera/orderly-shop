
import { NextRequest, NextResponse } from 'next/server';
import { appendRow, getSheetValues } from '@/lib/google-sheets';
import { createAdminClient } from '@/lib/supabase/admin';

const HEADER_ROW = [
    'Order Number',
    'Date',
    'Status',
    'Customer Name',
    'Phone',
    'Alt Phone',
    'City',
    'Address',
    'Product Name',
    'Variants',
    'Quantity',
    'Unit Price',
    'Item Total',
    'Order Total',
    'Notes'
];

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, storeId } = body;

        if (!orderId || !storeId) {
            return NextResponse.json(
                { success: false, message: 'Missing orderId or storeId' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();


        // 1. Fetch Order Details with Items
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    product:products(name)
                ),
                customer:customers(*)
            `)
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            console.error('Error fetching order for sync:', orderError);
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        // 2. Fetch Store Settings (for Service Account + Wallet Balance)
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('settings, balance, has_unlimited_balance')
            .eq('id', storeId)
            .single();

        if (storeError || !store) {
            return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
        }

        // Check wallet balance - stop sync if balance <= 0 (unless unlimited)
        if (!store.has_unlimited_balance && (store.balance ?? 0) <= 0) {
            console.log(`Google Sheets sync blocked for store ${storeId}: wallet balance is ${store.balance}`);
            return NextResponse.json({
                success: false,
                message: 'Wallet balance is insufficient. Please recharge to continue syncing.',
                reason: 'insufficient_balance'
            }, { status: 402 });
        }

        const serviceAccount = store.settings?.integrations?.google_service_account;
        if (!serviceAccount) {
            return NextResponse.json({ success: false, message: 'Service Account not configured' }, { status: 400 });
        }

        // 3. Fetch Active Google Sheet Integrations
        const { data: integrations, error: integrationsError } = await supabase
            .from('store_integrations')
            .select('*')
            .eq('store_id', storeId)
            .eq('provider', 'google_sheets')
            .eq('is_active', true);

        if (integrationsError) {
            console.error('Error fetching integrations:', integrationsError);
            return NextResponse.json({ success: false, message: 'Failed to fetch integrations' }, { status: 500 });
        }

        if (!integrations || integrations.length === 0) {
            return NextResponse.json({ success: true, message: 'No active Google Sheet integrations' });
        }

        const results: any[] = [];

        // 4. Process Each Integration
        for (const integration of integrations) {
            const config = integration.config as any;
            const sheetId = config.sheet_id;
            const tabName = config.tab_name || 'Sheet1';
            const mode = config.mode || 'all'; // 'all', 'specific', 'include'
            const targetProductIds = config.product_ids || [];

            // Filter Items based on Mode
            let itemsToExport = [];

            if (mode === 'all') {
                itemsToExport = order.order_items;
            } else if (mode === 'specific' || mode === 'include') {
                itemsToExport = order.order_items.filter((item: any) =>
                    targetProductIds.includes(item.product_id)
                );
            }

            if (itemsToExport.length === 0) {
                results.push({ id: integration.id, status: 'skipped', reason: 'No matching products' });
                continue;
            }

            const allProductNames: string[] = [];
            const allVariants: string[] = [];
            const allQuantities: string[] = [];
            const allUnitPrices: string[] = [];
            const allItemTotals: string[] = [];

            itemsToExport.forEach((item: any) => {
                const q = Math.max(1, item.quantity || 1);
                Array.from({ length: q }).forEach((_, pieceIndex) => {
                    let productName = 'Unknown Product';
                    try {
                        const nameData = item.product_snapshot?.name || item.product?.name;
                        if (nameData) {
                            const nameObj = typeof nameData === 'string' ? JSON.parse(nameData) : nameData;
                            productName = nameObj.ar || nameObj.en || (typeof nameData === 'string' ? nameData : 'Product');
                        }
                    } catch (e) {
                        productName = typeof item.product_snapshot?.name === 'string'
                            ? item.product_snapshot.name
                            : (item.product?.name || 'Product');
                    }

                    // Extract Variants
                    let variantsStr = '';
                    try {
                        const variantsSource = item.product_snapshot?.variants || item.variants;
                        if (variantsSource && Array.isArray(variantsSource)) {
                            const isMultiPiece = variantsSource.length > 0 && variantsSource.length % q === 0 && variantsSource.length >= q;
                            const variantsPerPiece = isMultiPiece ? variantsSource.length / q : variantsSource.length;
                            const pieceVariants = isMultiPiece
                                ? variantsSource.slice(pieceIndex * variantsPerPiece, (pieceIndex + 1) * variantsPerPiece)
                                : variantsSource;

                            variantsStr = pieceVariants
                                .map((v: any) => {
                                    const nameData = v.variantName || v.name;
                                    const labelData = v.optionLabel || v.value;

                                    let name = 'Variant';
                                    let label = 'Option';

                                    if (nameData) {
                                        if (typeof nameData === 'string') {
                                            try {
                                                const parsed = JSON.parse(nameData);
                                                name = parsed.ar || parsed.en || nameData;
                                            } catch {
                                                name = nameData;
                                            }
                                        } else {
                                            name = nameData.ar || nameData.en || 'Variant';
                                        }
                                    }

                                    if (labelData) {
                                        if (typeof labelData === 'string') {
                                            try {
                                                const parsed = JSON.parse(labelData);
                                                label = parsed.ar || parsed.en || labelData;
                                            } catch {
                                                label = labelData;
                                            }
                                        } else {
                                            label = labelData.ar || labelData.en || 'Option';
                                        }
                                    }

                                    return `${name}: ${label}`;
                                })
                                .join(', ');
                        }
                    } catch (e) {
                        // ignore
                    }

                    allProductNames.push(productName);
                    allVariants.push(variantsStr || 'None');
                    allQuantities.push('1');
                    allUnitPrices.push(String(item.unit_price));
                    allItemTotals.push(String(item.unit_price));
                });
            });

            const rows = [
                [
                    order.order_number,
                    new Date(order.created_at).toLocaleString('en-US'),
                    order.status,
                    order.customer_snapshot?.name || order.customer?.name || 'Guest',
                    order.customer_snapshot?.phone || order.customer?.phone || '',
                    order.customer_snapshot?.alt_phone || order.customer?.address?.alt_phone || '',
                    order.shipping_address?.city || '',
                    order.shipping_address?.address || '',
                    allProductNames.join('\n'),
                    allVariants.join('\n'),
                    allQuantities.join('\n'),
                    allUnitPrices.join('\n'),
                    allItemTotals.join('\n'),
                    order.total,
                    order.notes || ''
                ]
            ];

            // If an order somehow has no items, export an empty item row to record the order exists
            if (rows.length === 0) {
                rows.push([
                    order.order_number,
                    new Date(order.created_at).toLocaleString('en-US'),
                    order.status,
                    order.customer_snapshot?.name || order.customer?.name || 'Guest',
                    order.customer_snapshot?.phone || order.customer?.phone || '',
                    order.customer_snapshot?.alt_phone || order.customer?.address?.alt_phone || '',
                    order.shipping_address?.city || '',
                    order.shipping_address?.address || '',
                    '',
                    '',
                    '',
                    '',
                    0,
                    order.total,
                    order.notes || ''
                ]);
            }

            try {
                // Check if we need to add a header
                console.log(`Checking if header exists for sheet ${sheetId}, Tab: ${tabName}`);
                const existingValues = await getSheetValues(serviceAccount, sheetId, `${tabName}!A1:A1`);

                const rowsToExport = [...rows];
                if (!existingValues || existingValues.length === 0) {
                    console.log('Sheet is empty, adding header row');
                    rowsToExport.unshift(HEADER_ROW);
                }

                console.log(`Exporting to sheet ${sheetId}, Tab: ${tabName}, rows: ${rowsToExport.length}`);
                const response = await appendRow(serviceAccount, sheetId, tabName, rowsToExport);
                console.log(`Sync success for integration ${integration.id}:`, response);
                results.push({ id: integration.id, status: 'success' });
            } catch (error: any) {
                console.error(`Failed to export to sheet ${sheetId}:`, error);
                results.push({ id: integration.id, status: 'failed', error: error.message });
            }
        }

        console.log('Sync finished with results:', results);

        // Mark order as synced if at least one export succeeded
        const hasSuccess = results.some(r => r.status === 'success');
        if (hasSuccess) {
            const { error: updateError } = await supabase
                .from('orders')
                .update({ is_synced: true })
                .eq('id', orderId);

            if (updateError) {
                console.error('Failed to update order is_synced status:', updateError);
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error('Error syncing to Google Sheets:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
