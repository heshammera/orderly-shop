"use client";

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Search, Download, Loader2, Plus, Calendar as CalendarIcon, Filter, X, Trash2, Printer, AlertTriangle, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { PrintableOrderInvoice } from './PrintableOrderInvoice';
import { format } from 'date-fns';
import { OrderDetailsDialog } from './OrderDetailsDialog';
import { CreateOrderDialog } from './CreateOrderDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface Order {
    id: string;
    order_number: string;
    status: string;
    total: number;
    currency: string;
    customer_snapshot: any;
    created_at: string;
    is_viewed?: boolean;
    is_synced?: boolean;
    items: any[];
}

interface OrdersTableProps {
    storeId: string;
}

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    shipped: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    returned: 'bg-orange-100 text-orange-800 border-orange-200',
};

import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';

export function OrdersTable({ storeId }: OrdersTableProps) {
    const supabase = createClient();
    const { language, t } = useLanguage();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [storeRestricted, setStoreRestricted] = useState(false);

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

    // Bulk Selection State
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const printRef = useRef<HTMLDivElement>(null);

    // Export and Sync State
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [exportDateRange, setExportDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
    const [exporting, setExporting] = useState(false);
    const [syncingOrders, setSyncingOrders] = useState<Set<string>>(new Set());

    // Enable Real-time updates
    useRealtimeOrders(storeId, setOrders);


    // Fetch Store Settings & Orders
    useEffect(() => {
        const init = async () => {
            setLoading(true);

            // 1. Check Store Balance & Plan Usage
            // We need to know:
            // a) Is balance <= 0 and not unlimited?
            // b) Is plan usage > plan limit?

            const { data: storeData } = await supabase
                .from('stores')
                .select('balance, has_unlimited_balance') // This requires the column to exist!
                .eq('id', storeId)
                .single();

            // Fail Safe: If store data missing, assume low balance to be safe
            const isBalanceLow = storeData ? ((Number(storeData.balance) || 0) <= 0 && !storeData.has_unlimited_balance) : true;

            // Check Plan Usage via RPC
            const { data: usageData, error: usageError } = await supabase
                .rpc('get_store_plan_usage', { p_store_id: storeId });

            let isOverLimit = false;

            if (usageData) {
                const limit = Number(usageData.limit ?? 0);
                const usage = Number(usageData.usage ?? 0);

                // Correct Logic:
                // If limit is -1, it means UNLIMITED -> Not Over Limit.
                // If limit is 0, it means STRICTLY NO ORDERS -> Always Over Limit (unless usage is 0? No, usage will be >= 0).
                // If limit > 0, check usage >= limit.

                if (limit === -1) {
                    isOverLimit = false;
                } else if (limit === 0 || usage >= limit) {
                    isOverLimit = true;
                }
            } else {
                // Fail Safe: If we can't load usage data, assume restricted to be safe
                console.warn("Could not load plan usage, defaulting to restricted");
                isOverLimit = true;
            }

            // RESTRICTION LOGIC:
            // Restrict ONLY if (Balance is Low AND Over Limit)
            // Or maybe if Balance is Low AND (No Plan OR Over Limit)
            // The requirement: "Don't deduct or hide if within limit"
            // So if within limit (isOverLimit = false), then NO RESTRICTION even if balance is low.

            const shouldRestrict = isBalanceLow && isOverLimit;

            setStoreRestricted(shouldRestrict);

            if (usageError) console.error("Plan Usage Error:", usageError);

            // 2. Fetch Orders
            await fetchOrders();
        };

        init();
    }, [storeId]);

    const [linkedProductIds, setLinkedProductIds] = useState<Set<string> | 'all'>(new Set());

    useEffect(() => {
        const fetchIntegrations = async () => {
            if (!storeId) return;
            const { data, error } = await supabase
                .from('store_integrations')
                .select('config')
                .eq('store_id', storeId)
                .eq('provider', 'google_sheets')
                .eq('is_active', true);

            if (error || !data || data.length === 0) {
                setLinkedProductIds(new Set());
                return;
            }

            let isAll = false;
            const productIds = new Set<string>();
            data.forEach(integration => {
                const config = integration.config as any;
                if (!config) return;
                const mode = config.mode || 'all';
                if (mode === 'all') {
                    isAll = true;
                } else if (config.product_ids && Array.isArray(config.product_ids)) {
                    config.product_ids.forEach((id: string) => productIds.add(id));
                }
            });

            if (isAll) {
                setLinkedProductIds('all');
            } else {
                setLinkedProductIds(productIds);
            }
        };
        fetchIntegrations();
    }, [storeId]);

    const fetchOrders = async () => {
        // setLoading(true); // Moved to init to avoid double loading state
        try {
            let query = supabase
                .from('orders')
                .select(`
                  id,
                  order_number,
                  status,
                  total,
                  currency,
                  customer_snapshot,
                  created_at,
                  is_viewed,
                  is_synced,
                  order_items (
                    id,
                    product_id,
                    product_snapshot,
                    quantity,
                    unit_price
                  )
                `)
                .eq('store_id', storeId)
                .order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;

            setOrders(data?.map((order: any) => ({
                ...order,
                items: order.order_items || []
            })) || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    // ... existing handlers ...

    const isProductGoogleSheetLinked = (item: any) => {
        if (linkedProductIds === 'all') return true;
        return linkedProductIds.has(item.product_id);
    };

    const isOrderGoogleSheetLinked = (order: Order) => {
        return order.items.some(isProductGoogleSheetLinked);
    };

    const handleSyncOrder = async (order: Order) => {
        if (order.is_synced) {
            toast.error(language === 'ar' ? 'الطلب متزامن مسبقاً' : 'Order already synced');
            return;
        }

        if (!isOrderGoogleSheetLinked(order)) {
            toast.error(language === 'ar' ? 'لا توجد منتجات مرتبطة بجوجل شيت' : 'No Google Sheet linked products');
            return;
        }

        setSyncingOrders(prev => new Set(prev).add(order.id));
        try {
            const res = await fetch('/api/integrations/google-sheets/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id, storeId })
            });

            const resData = await res.json().catch(() => ({}));

            if (!res.ok || resData.success === false) {
                throw new Error(resData.message || resData.error || 'Sync failed');
            }

            const hasSuccess = resData.results?.some((r: any) => r.status === 'success');
            if (resData.results && !hasSuccess) {
                const errorStr = resData.results.find((r: any) => r.error)?.error || 'No matching logic found';
                throw new Error(errorStr);
            }

            const { error } = await supabase.from('orders').update({ is_synced: true }).eq('id', order.id);
            if (error) throw error;

            toast.success(language === 'ar' ? 'تمت مزامنة الطلب' : 'Order synced successfully');
            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, is_synced: true } : o));
        } catch (error: any) {
            console.error('Sync error:', error);
            toast.error(error.message || (language === 'ar' ? 'فشل المزامنة، حاول مجدداً' : 'Failed to sync order'));
        } finally {
            setSyncingOrders(prev => {
                const next = new Set(prev);
                next.delete(order.id);
                return next;
            });
        }
    };

    const handleBulkSync = async () => {
        const eligibleOrders = orders.filter(o => selectedOrders.includes(o.id) && !o.is_synced && isOrderGoogleSheetLinked(o));

        if (eligibleOrders.length === 0) {
            toast.error(language === 'ar' ? 'لا توجد طلبات قابلة للمزامنة' : 'No eligible orders to sync');
            return;
        }

        const idsToSync = eligibleOrders.map(o => o.id);
        idsToSync.forEach(id => setSyncingOrders(prev => new Set(prev).add(id)));

        try {
            const successfulIds: string[] = [];
            let failedCount = 0;

            for (const id of idsToSync) {
                try {
                    const res = await fetch('/api/integrations/google-sheets/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId: id, storeId })
                    });

                    const resData = await res.json().catch(() => ({}));
                    if (!res.ok || resData.success === false) {
                        throw new Error(resData.message || resData.error || `Sync failed for ${id}`);
                    }

                    const hasSuccess = resData.results?.some((r: any) => r.status === 'success');
                    if (resData.results && !hasSuccess) {
                        const errMessage = resData.results.find((r: any) => r.error)?.error || `No products verified for ${id}`;
                        throw new Error(errMessage);
                    }

                    successfulIds.push(id);
                } catch (error) {
                    console.error(`Error syncing order ${id}:`, error);
                    failedCount++;
                }
            }

            if (successfulIds.length > 0) {
                toast.success(language === 'ar' ? `تمت مزامنة ${successfulIds.length} طلب بنجاح` : `${successfulIds.length} orders synced successfully`);
                setOrders(prev => prev.map(o => successfulIds.includes(o.id) ? { ...o, is_synced: true } : o));
            }
            if (failedCount > 0) {
                toast.error(language === 'ar' ? `فشلت مزامنة ${failedCount} طلبات` : `Failed to sync ${failedCount} orders`);
            }

            setSelectedOrders([]);
        } catch (error) {
            console.error('Bulk sync error:', error);
            toast.error(language === 'ar' ? 'حدث خطأ أثناء المزامنة المجمعة' : 'Failed to sync orders');
        } finally {
            setSyncingOrders(prev => {
                const next = new Set(prev);
                idsToSync.forEach(id => next.delete(id));
                return next;
            });
        }
    };

    const handleExportExcel = async () => {
        if (!exportDateRange.from || !exportDateRange.to) {
            toast.error(language === 'ar' ? 'يرجى تحديد تفضيلات التاريخ' : 'Please select date range');
            return;
        }

        setExporting(true);
        try {
            const endOfDay = new Date(exportDateRange.to);
            endOfDay.setHours(23, 59, 59, 999);

            const { data, error } = await supabase
                .from('orders')
                .select(`
                  *,
                  order_items (
                    *,
                    product:products(name)
                  )
                `)
                .eq('store_id', storeId)
                .gte('created_at', exportDateRange.from.toISOString())
                .lte('created_at', endOfDay.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                toast.error(language === 'ar' ? 'لا توجد طلبات في هذا النطاق الزمني' : 'No orders found in this date range');
                setExporting(false);
                return;
            }

            const excelData = data.map(order => {
                const items = order.order_items || [];

                // If an order somehow has no items, still export it as one row with empty product details
                if (items.length === 0) {
                    return {
                        'Order Number': order.order_number,
                        'Date': format(new Date(order.created_at), 'yyyy-MM-dd HH:mm:ss'),
                        'Status': order.status,
                        'Customer Name': order.customer_snapshot?.name || order.customer?.name || 'Guest',
                        'Phone': order.customer_snapshot?.phone || order.customer?.phone || '',
                        'Alt Phone': order.customer_snapshot?.alt_phone || order.customer?.alt_phone || order.shipping_address?.alt_phone || '',
                        'City': order.shipping_address?.city || '',
                        'Address': order.shipping_address?.address || '',
                        'Product Name': '',
                        'Variants': '',
                        'Quantity': '',
                        'Unit Price': '',
                        'Item Total': 0,
                        'Order Total': order.total,
                        'Notes': order.notes || ''
                    };
                }

                const allProductNames: string[] = [];
                const allVariants: string[] = [];
                const allQuantities: string[] = [];
                const allUnitPrices: string[] = [];
                const allItemTotals: string[] = [];

                // Map each item to its own row(s) based on quantity
                items.forEach((item: any) => {
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
                        } catch (e) { }

                        allProductNames.push(productName);
                        allVariants.push(variantsStr || 'None');
                        allQuantities.push('1');
                        allUnitPrices.push(String(item.unit_price));
                        allItemTotals.push(String(item.unit_price));
                    });
                });

                return {
                    'Order Number': order.order_number,
                    'Date': format(new Date(order.created_at), 'yyyy-MM-dd HH:mm:ss'),
                    'Status': order.status,
                    'Customer Name': order.customer_snapshot?.name || order.customer?.name || 'Guest',
                    'Phone': order.customer_snapshot?.phone || order.customer?.phone || '',
                    'Alt Phone': order.customer_snapshot?.alt_phone || order.customer?.alt_phone || order.shipping_address?.alt_phone || '',
                    'City': order.shipping_address?.city || '',
                    'Address': order.shipping_address?.address || '',
                    'Product Name': allProductNames.join('\n'),
                    'Variants': allVariants.join('\n'),
                    'Quantity': allQuantities.join('\n'),
                    'Unit Price': allUnitPrices.join('\n'),
                    'Item Total': allItemTotals.join('\n'),
                    'Order Total': order.total,
                    'Notes': order.notes || ''
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

            const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
            XLSX.writeFile(workbook, `Orders_Export_${timestamp}.xlsx`);
            toast.success(language === 'ar' ? 'تم التصدير بنجاح' : 'Exported successfully');
            setExportDialogOpen(false);
        } catch (error) {
            console.error('Export error:', error);
            toast.error(language === 'ar' ? 'فشل التصدير' : 'Failed to export orders');
        } finally {
            setExporting(false);
        }
    };

    // Data Masking Helper
    const maskData = (text: string | undefined | null) => {
        if (!text) return '';
        if (!storeRestricted) return text;

        // Simple masking: Keep first and last char, mask middle
        return text.split(' ').map(word => {
            if (word.length <= 2) return '**';
            const first = word[0];
            const last = word[word.length - 1];
            return `${first}**** ${last} `;
        }).join(' ');
    };

    // ... existing filter logic ...

    // ... render ...



    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;
            toast.success(language === 'ar' ? 'تم تحديث الحالة' : 'Status updated');
            fetchOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const handleViewDetails = async (order: Order) => {
        setSelectedOrder(order);
        setDetailsOpen(true);

        if (!order.is_viewed) {
            try {
                setOrders(prev => prev.map(o => o.id === order.id ? { ...o, is_viewed: true } : o));
                await supabase.from('orders').update({ is_viewed: true }).eq('id', order.id);
            } catch (error) {
                console.error('Failed to mark as viewed', error);
            }
        }
    };

    // Dynamic Filters
    type FilterType = 'status' | 'sync_status' | 'order_number' | 'customer_name' | 'customer_phone' | 'customer_address' | 'product_name' | 'date_range' | 'total_min' | 'total_max';

    interface ActiveFilter {
        id: string;
        type: FilterType;
        value: any;
    }

    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

    const addFilter = (type: FilterType) => {
        if (activeFilters.some(f => f.type === type && type !== 'product_name')) {
            toast.error(language === 'ar' ? 'هذا الفلتر موجود بالفعل' : 'Filter already active');
            return;
        }
        setActiveFilters([...activeFilters, { id: Math.random().toString(36).substr(2, 9), type, value: '' }]);
    };

    const removeFilter = (id: string) => {
        setActiveFilters(activeFilters.filter(f => f.id !== id));
    };

    const updateFilterValue = (id: string, value: any) => {
        setActiveFilters(activeFilters.map(f => f.id === id ? { ...f, value } : f));
    };

    // Advanced Filtering Logic
    const filteredOrders = orders.filter(order => {
        return activeFilters.every(filter => {
            if (!filter.value) return true; // Ignore empty filters

            switch (filter.type) {
                case 'status':
                    return order.status === filter.value;
                case 'sync_status':
                    if (filter.value === 'synced') return order.is_synced === true;
                    if (filter.value === 'pending') return !order.is_synced && isOrderGoogleSheetLinked(order);
                    if (filter.value === 'not_linked') return !order.is_synced && !isOrderGoogleSheetLinked(order);
                    return true;
                case 'order_number':
                    return order.order_number.toLowerCase().includes(filter.value.toLowerCase());
                case 'customer_name':
                    return order.customer_snapshot?.name?.toLowerCase().includes(filter.value.toLowerCase());
                case 'customer_phone':
                    return order.customer_snapshot?.phone?.includes(filter.value);
                case 'customer_address':
                    const addr = order.customer_snapshot?.address;
                    const addrStr = typeof addr === 'string' ? addr : JSON.stringify(addr || {});
                    return addrStr.toLowerCase().includes(filter.value.toLowerCase());
                case 'product_name':
                    return order.items.some(item => {
                        const pName = typeof item.product_snapshot?.name === 'string'
                            ? item.product_snapshot.name
                            : JSON.stringify(item.product_snapshot?.name || '');
                        return pName.toLowerCase().includes(filter.value.toLowerCase());
                    });
                case 'date_range':
                    if (!filter.value.from) return true;
                    const orderDate = new Date(order.created_at);
                    if (orderDate < filter.value.from) return false;
                    if (filter.value.to) {
                        const endOfDay = new Date(filter.value.to);
                        endOfDay.setHours(23, 59, 59, 999);
                        if (orderDate > endOfDay) return false;
                    }
                    return true;
                default:
                    return true;
            }
        });
    });

    const getFilterLabel = (type: FilterType) => {
        const labels: Record<FilterType, { ar: string, en: string }> = {
            status: { ar: 'حالة الطلب', en: 'Status' },
            sync_status: { ar: 'حالة المزامنة', en: 'Sync Status' },
            order_number: { ar: 'رقم الطلب', en: 'Order Number' },
            customer_name: { ar: 'اسم العميل', en: 'Customer Name' },
            customer_phone: { ar: 'رقم الهاتف', en: 'Phone Number' },
            customer_address: { ar: 'عنوان العميل', en: 'Address' },
            product_name: { ar: 'اسم المنتج', en: 'Product Name' },
            date_range: { ar: 'التاريخ', en: 'Date Range' },
            total_min: { ar: 'أقل مبلغ', en: 'Min Total' },
            total_max: { ar: 'أكثر مبلغ', en: 'Max Total' },
        };
        return language === 'ar' ? labels[type].ar : labels[type].en;
    };

    // Bulk Actions Logic
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedOrders(filteredOrders.map(o => o.id));
        } else {
            setSelectedOrders([]);
        }
    };

    const handleSelectOrder = (orderId: string, checked: boolean) => {
        if (checked) {
            setSelectedOrders(prev => [...prev, orderId]);
        } else {
            setSelectedOrders(prev => prev.filter(id => id !== orderId));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف الطلبات المحددة؟' : 'Are you sure you want to delete selected orders?')) return;

        try {
            const { error } = await supabase
                .from('orders')
                .delete()
                .in('id', selectedOrders);

            if (error) throw error;
            toast.success(language === 'ar' ? 'تم حذف الطلبات' : 'Orders deleted');
            setSelectedOrders([]);
            fetchOrders();
        } catch (error) {
            console.error('Error deleting orders:', error);
            toast.error('Failed to delete orders');
        }
    };

    const handleBulkPrint = () => {
        const printContent = printRef.current;
        if (printContent) {
            // Create a temporary container for printing
            const printContainer = document.createElement('div');
            printContainer.id = 'print-container';
            printContainer.innerHTML = printContent.innerHTML;
            document.body.appendChild(printContainer);

            // Add print styles
            const style = document.createElement('style');
            style.innerHTML = `
        @media print {
            body > *:not(#print-container) {
                display: none !important;
            }
            #print-container {
                display: block !important;
                position: relative !important;
                width: 100% !important;
                left: 0 !important;
                top: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white;
            }
            .page-break {
                page-break-after: always;
            }
            @page {
                size: A4;
                margin: 1cm;
            }
        }
`;
            document.head.appendChild(style);

            window.print();

            // Cleanup
            document.body.removeChild(printContainer);
            document.head.removeChild(style);
        } else {
            toast.error("Nothing to print");
        }
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {storeRestricted && (
                <div className="bg-destructive/15 border-destructive/20 text-destructive p-4 rounded-md border flex items-start gap-3 mb-6">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <h4 className="font-semibold tracking-tight">
                            {language === 'ar' ? 'تم تقييد الوصول' : 'Access Restricted'}
                        </h4>
                        <p className="text-sm opacity-90">
                            {language === 'ar'
                                ? 'لقد تجاوزت حدود باقتك أو رصيدك الحالي منخفض. تم إخفاء بيانات العملاء وتعطيل التصدير.'
                                : 'You have exceeded your plan limits or have insufficient balance. Customer data is masked and exports are disabled.'}
                        </p>
                    </div>
                </div>
            )}
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex gap-2 w-full sm:w-auto items-center">
                    <h2 className="text-xl font-bold tracking-tight">{language === 'ar' ? 'الطلبات' : 'Orders'}</h2>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'طلب جديد' : 'New Order'}
                    </Button>
                    {!storeRestricted && (
                        <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
                            <Download className="w-4 h-4 mr-2" />
                            {language === 'ar' ? 'تصدير' : 'Export'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Status Filter Bar */}
            <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto">
                <Button
                    variant={!activeFilters.some(f => f.type === 'status') ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                        setActiveFilters(activeFilters.filter(f => f.type !== 'status'));
                    }}
                >
                    {language === 'ar' ? 'الكل' : 'All'}
                </Button>
                {Object.keys(STATUS_STYLES).map(status => {
                    const isActive = activeFilters.some(f => f.type === 'status' && f.value === status);
                    return (
                        <Button
                            key={status}
                            variant="outline"
                            size="sm"
                            className={cn(
                                "rounded-full border transition-all",
                                isActive ? STATUS_STYLES[status] + " ring-2 ring-offset-1 ring-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => {
                                const newFilters = activeFilters.filter(f => f.type !== 'status');
                                setActiveFilters([
                                    ...newFilters,
                                    { id: 'status-filter', type: 'status', value: status }
                                ]);
                            }}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                    );
                })}
            </div>

            {/* Dynamic Filters Section */}
            <div className="bg-muted/10 p-4 rounded-lg border space-y-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{language === 'ar' ? 'تصفية حسب:' : 'Filter by:'}</span>

                    <Select onValueChange={(val) => addFilter(val as FilterType)}>
                        <SelectTrigger className="w-[180px] h-8">
                            <SelectValue placeholder={language === 'ar' ? 'إضافة فلتر...' : 'Add Filter...'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="status">{getFilterLabel('status')}</SelectItem>
                            <SelectItem value="sync_status">{getFilterLabel('sync_status')}</SelectItem>
                            <SelectItem value="order_number">{getFilterLabel('order_number')}</SelectItem>
                            <SelectItem value="customer_name">{getFilterLabel('customer_name')}</SelectItem>
                            <SelectItem value="customer_phone">{getFilterLabel('customer_phone')}</SelectItem>
                            <SelectItem value="customer_address">{getFilterLabel('customer_address')}</SelectItem>
                            <SelectItem value="product_name">{getFilterLabel('product_name')}</SelectItem>
                            <SelectItem value="date_range">{getFilterLabel('date_range')}</SelectItem>
                        </SelectContent>
                    </Select>

                    {activeFilters.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setActiveFilters([])} className="text-destructive h-8 px-2">
                            {language === 'ar' ? 'حذف الكل' : 'Clear All'}
                        </Button>
                    )}
                </div>

                {activeFilters.length > 0 && (
                    <div className="flex flex-wrap gap-3 p-2 bg-background rounded border border-dashed">
                        {activeFilters.map(filter => (
                            <div key={filter.id} className="flex items-center gap-2 bg-secondary/50 p-2 rounded-md border shadow-sm animate-in fade-in zoom-in-95">
                                <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                                    {getFilterLabel(filter.type)}
                                </span>

                                <div className="min-w-[150px]">
                                    {filter.type === 'status' && (
                                        <Select value={filter.value} onValueChange={(val) => updateFilterValue(filter.id, val)}>
                                            <SelectTrigger className="h-8 border-none bg-transparent focus:ring-0">
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="processing">Processing</SelectItem>
                                                <SelectItem value="shipped">Shipped</SelectItem>
                                                <SelectItem value="delivered">Delivered</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}

                                    {filter.type === 'sync_status' && (
                                        <Select value={filter.value} onValueChange={(val) => updateFilterValue(filter.id, val)}>
                                            <SelectTrigger className="h-8 border-none bg-transparent focus:ring-0">
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="synced">{language === 'ar' ? 'متزامن' : 'Synced'}</SelectItem>
                                                <SelectItem value="pending">{language === 'ar' ? 'بانتظار المزامنة' : 'Pending Sync'}</SelectItem>
                                                <SelectItem value="not_linked">{language === 'ar' ? 'غير مرتبط' : 'Not Linked'}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}

                                    {filter.type === 'date_range' && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="sm" className={cn("h-8 w-full justify-start text-left font-normal", !filter.value?.from && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-3 w-3" />
                                                    {filter.value?.from ? format(filter.value.from, "PPP") : <span>Pick date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={filter.value?.from}
                                                    onSelect={(date) => updateFilterValue(filter.id, { ...filter.value, from: date })}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    )}

                                    {/* Text Inputs for other types */}
                                    {['order_number', 'customer_name', 'customer_phone', 'customer_address', 'product_name'].includes(filter.type) && (
                                        <Input
                                            value={filter.value}
                                            onChange={(e) => updateFilterValue(filter.id, e.target.value)}
                                            className="h-7 border-none bg-transparent focus-visible:ring-0 min-w-[120px]"
                                            placeholder="..."
                                        />
                                    )}
                                </div>

                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => removeFilter(filter.id)}>
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Orders Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>
                        {filteredOrders.length} {language === 'ar' ? 'طلب' : 'Orders'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                    />
                                </TableHead>
                                <TableHead>{language === 'ar' ? 'رقم الطلب' : 'Order #'}</TableHead>
                                <TableHead>{language === 'ar' ? 'العميل' : 'Customer'}</TableHead>
                                <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                                <TableHead>{language === 'ar' ? 'المبلغ' : 'Total'}</TableHead>
                                <TableHead className="text-right">{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        <p>{language === 'ar' ? 'لا توجد طلبات تطابق الفلاتر' : 'No orders match your filters'}</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order.id} className={selectedOrders.includes(order.id) ? "bg-muted/50" : ""}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedOrders.includes(order.id)}
                                                onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            #{order.order_number}
                                            {!order.is_viewed && (
                                                <Badge className="ml-2 bg-blue-500 hover:bg-blue-600 animate-pulse">
                                                    {language === 'ar' ? 'جديد' : 'New'}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{maskData(order.customer_snapshot?.name || 'N/A')}</span>
                                                <span className="text-xs text-muted-foreground">{maskData(order.customer_snapshot?.phone)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={order.status}
                                                onValueChange={(value) => handleStatusChange(order.id, value)}
                                            >
                                                <SelectTrigger className="w-[130px] h-8 border-none bg-transparent p-0 focus:ring-0">
                                                    <Badge variant="outline" className={`${STATUS_STYLES[order.status] || 'bg-gray-100'} px-3 py-1 cursor-pointer hover:opacity-80 transition-opacity`}>
                                                        {order.status}
                                                    </Badge>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="processing">Processing</SelectItem>
                                                    <SelectItem value="shipped">Shipped</SelectItem>
                                                    <SelectItem value="delivered">Delivered</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(order.created_at), 'MMM dd, HH:mm')}
                                            <div className="mt-1 flex items-center gap-1">
                                                {order.is_synced ? (
                                                    <Badge variant="outline" className="text-xs py-0 h-5 bg-green-50 text-green-700 border-green-200">
                                                        <FileSpreadsheet className="w-3 h-3 mr-1" />
                                                        {language === 'ar' ? 'متزامن' : 'Synced'}
                                                    </Badge>
                                                ) : isOrderGoogleSheetLinked(order) ? (
                                                    <Badge variant="outline" className="text-xs py-0 h-5 bg-yellow-50 text-yellow-700 border-yellow-200">
                                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                                        {language === 'ar' ? 'بانتظار المزامنة' : 'Pending Sync'}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs py-0 h-5 bg-gray-50 text-gray-500 border-gray-200">
                                                        {language === 'ar' ? 'غير مرتبط' : 'Not Linked'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {order.total} {order.currency}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {!order.is_synced && isOrderGoogleSheetLinked(order) && !storeRestricted && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleSyncOrder(order)}
                                                        disabled={syncingOrders.has(order.id)}
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        title={language === 'ar' ? 'مزامنة' : 'Sync'}
                                                    >
                                                        <RefreshCw className={cn("w-4 h-4", syncingOrders.has(order.id) && "animate-spin")} />
                                                    </Button>
                                                )}
                                                {!order.is_synced && !isOrderGoogleSheetLinked(order) && !storeRestricted && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setExportDateRange({ from: new Date(order.created_at), to: new Date(order.created_at) });
                                                            setExportDialogOpen(true);
                                                        }}
                                                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                        title={language === 'ar' ? 'تصدير مرجعي كإكسل' : 'Export Excel'}
                                                    >
                                                        <FileSpreadsheet className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(order)}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    {language === 'ar' ? 'تفاصيل' : 'Details'}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Hidden Print Container */}
            {!storeRestricted && (
                <div className="hidden">
                    <div ref={printRef}>
                        {orders
                            .filter(o => selectedOrders.includes(o.id))
                            .map(order => (
                                <PrintableOrderInvoice
                                    key={order.id}
                                    order={order}
                                    language={language}
                                />
                            ))
                        }
                    </div>
                </div>
            )}

            {/* Bulk Action Bar - Fixed Bottom */}
            {selectedOrders.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-green-50 border border-green-200 shadow-lg rounded-full px-6 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <span className="text-green-800 font-medium whitespace-nowrap">
                        {selectedOrders.length} {language === 'ar' ? 'عناصر محددة' : 'Selected Elements'}
                    </span>

                    <div className="h-4 w-px bg-green-200" />

                    {!storeRestricted && (
                        <>
                            <Button variant="ghost" size="sm" onClick={handleBulkSync} className="text-blue-700 hover:text-blue-900 hover:bg-blue-100">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'مزامنة المحدد' : 'Sync Selected'}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleBulkPrint} className="text-green-700 hover:text-green-900 hover:bg-green-100">
                                <Printer className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'طباعة الطلبات المحددة' : 'Print Selected'}
                            </Button>
                        </>
                    )}

                    <Button variant="ghost" size="sm" onClick={handleBulkDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'حذف' : 'Delete'}
                    </Button>

                    <div className="h-4 w-px bg-green-200" />

                    <Button variant="ghost" size="icon" onClick={() => setSelectedOrders([])} className="text-green-800 hover:bg-green-100 rounded-full h-6 w-6">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Dialogs */}
            {selectedOrder && (
                <OrderDetailsDialog
                    order={selectedOrder}
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                    onStatusChange={(newStatus) => {
                        handleStatusChange(selectedOrder.id, newStatus);
                        setDetailsOpen(false);
                    }}
                    isRestricted={storeRestricted}
                />
            )}

            <CreateOrderDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                storeId={storeId}
                onOrderCreated={fetchOrders}
            />

            {/* Export Dialog */}
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{language === 'ar' ? 'تصدير الطلبات' : 'Export Orders'}</DialogTitle>
                        <DialogDescription>
                            {language === 'ar' ? 'اختر النطاق الزمني للطلبات التي تريد تصديرها.' : 'Select date range for the orders you want to export.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex gap-4">
                            <div className="flex flex-col gap-2 flex-1">
                                <span className="text-sm font-medium">{language === 'ar' ? 'من' : 'From'}</span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !exportDateRange.from && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {exportDateRange.from ? format(exportDateRange.from, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={exportDateRange.from}
                                            onSelect={(date) => setExportDateRange(prev => ({ ...prev, from: date }))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="flex flex-col gap-2 flex-1">
                                <span className="text-sm font-medium">{language === 'ar' ? 'إلى' : 'To'}</span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !exportDateRange.to && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {exportDateRange.to ? format(exportDateRange.to, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={exportDateRange.to}
                                            onSelect={(date) => setExportDateRange(prev => ({ ...prev, to: date }))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button
                            onClick={handleExportExcel}
                            disabled={exporting || !exportDateRange.from || !exportDateRange.to}
                        >
                            {exporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {language === 'ar' ? 'تصدير Excel' : 'Export Excel'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
