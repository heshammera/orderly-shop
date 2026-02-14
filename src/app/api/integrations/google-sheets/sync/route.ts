
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { appendRow } from '@/lib/google-sheets';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                },
            }
        );

        // 1. Fetch Order Details with Items
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    product:products(name_ar, name_en)
                ),
                customer:customers(*)
            `)
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            console.error('Error fetching order for sync:', orderError);
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        // 2. Fetch Store Settings (for Service Account)
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('settings')
            .eq('id', storeId)
            .single();

        if (storeError || !store) {
            return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
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

        const results = [];

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

            // Prepare Row Data
            // We'll create one row per order item, or one row per order?
            // Usually, for detailed export, one row per item is better.
            // Or aggregate? Let's do one row per item for now as it's standard.

            const rows = itemsToExport.map((item: any) => {
                return [
                    order.order_number,
                    new Date(order.created_at).toLocaleString('en-US'),
                    order.status,
                    order.customer_snapshot?.name || order.customer?.name || 'Guest',
                    order.customer_snapshot?.phone || order.customer?.phone || '',
                    order.shipping_address?.city || '',
                    order.shipping_address?.address || '',
                    item.product_snapshot?.name || item.product?.name_en || 'Unknown Product',
                    item.quantity,
                    item.unit_price,
                    item.total_price,
                    order.total,
                    order.notes || ''
                ];
            });

            try {
                await appendRow(serviceAccount, sheetId, tabName, rows);
                results.push({ id: integration.id, status: 'success' });
            } catch (error: any) {
                console.error(`Failed to export to sheet ${sheetId}:`, error);
                results.push({ id: integration.id, status: 'failed', error: error.message });
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
