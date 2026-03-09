import { createClient } from '@/lib/supabase/client';
import { format, subDays } from 'date-fns';

export async function exportStoreReport(storeId: string, dateRange: string, language: string) {
    const supabase = createClient();

    // Determine start date
    let days = 30;
    if (dateRange === '7d') days = 7;
    if (dateRange === '90d') days = 90;
    if (dateRange === '180d') days = 180;
    if (dateRange === '365d') days = 365;

    const startDate = subDays(new Date(), days).toISOString();

    try {
        // Fetch Orders
        const { data: orders } = await supabase
            .from('orders')
            .select('order_number, created_at, status, total, currency, customer_snapshot')
            .eq('store_id', storeId)
            .gte('created_at', startDate)
            .order('created_at', { ascending: false });

        if (!orders || orders.length === 0) {
            return { success: false, message: language === 'ar' ? 'لا توجد بيانات' : 'No data available' };
        }

        // Prepare CSV Content
        const headers = language === 'ar'
            ? ['رقم الطلب', 'التاريخ', 'الحالة', 'الإجمالي', 'العملة', 'اسم العميل', 'هاتف العميل']
            : ['Order Number', 'Date', 'Status', 'Total', 'Currency', 'Customer Name', 'Customer Phone'];

        const rows = orders.map(order => {
            const customer = order.customer_snapshot as any;
            return [
                order.order_number,
                format(new Date(order.created_at), 'yyyy-MM-dd HH:mm'),
                order.status,
                order.total,
                order.currency,
                customer?.name || '',
                customer?.phone || ''
            ];
        });

        // Convert to CSV string (handling commas in data)
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(r => `"${String(r).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        // Create Blob and trigger download
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `store_report_${storeId}_${dateRange}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return { success: true };
    } catch (error) {
        console.error('Export Error:', error);
        return { success: false, message: language === 'ar' ? 'حدث خطأ أثناء التصدير' : 'Export failed' };
    }
}
