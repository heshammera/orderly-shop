const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testExport() {
    // Use the EXACT same query as OrdersTable.tsx handleExportExcel (line 376-388)
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                *,
                product:products(name)
            )
        `)
        .order('created_at', { ascending: false })
        .limit(15);

    if (error) { console.error('QUERY ERROR:', error); return; }

    console.log('=== ORDERS FROM DB ===');
    for (const order of data) {
        const items = order.order_items || [];
        console.log(`\n${order.order_number} (total: ${order.total})`);
        console.log(`  DB items count: ${items.length}`);
        for (const item of items) {
            const name = typeof item.product_snapshot?.name === 'string'
                ? item.product_snapshot.name
                : (item.product_snapshot?.name?.ar || 'Unknown');
            console.log(`  -> "${name}" qty=${item.quantity} price=${item.unit_price}`);
        }
    }

    console.log('\n\n=== SIMULATED EXPORT OUTPUT ===');
    const excelData = data.flatMap(order => {
        const items = order.order_items || [];
        if (items.length === 0) {
            return [{ orderNum: order.order_number, product: '<empty>', qty: 0, total: order.total }];
        }
        return items.flatMap((item) => {
            const q = Math.max(1, item.quantity || 1);
            return Array.from({ length: q }).map((_, pieceIndex) => {
                let productName = 'Unknown';
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
                return {
                    orderNum: order.order_number,
                    product: productName,
                    qty: 1,
                    unitPrice: item.unit_price,
                    total: order.total
                };
            });
        });
    });

    console.log(`Total export rows: ${excelData.length}`);
    for (const row of excelData) {
        console.log(`  ${row.orderNum} | ${row.product} | qty=${row.qty} | price=${row.unitPrice} | orderTotal=${row.total}`);
    }
}

testExport();
