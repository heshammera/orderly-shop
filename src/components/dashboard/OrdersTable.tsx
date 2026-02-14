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
import { Eye, Search, Download, Loader2, Plus, Calendar as CalendarIcon, Filter, X, Trash2, Printer, AlertTriangle } from 'lucide-react';
import { PrintableOrderInvoice } from './PrintableOrderInvoice';
import { format } from 'date-fns';
import { OrderDetailsDialog } from './OrderDetailsDialog';
import { CreateOrderDialog } from './CreateOrderDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Order {
    id: string;
    order_number: string;
    status: string;
    total: number;
    currency: string;
    customer_snapshot: any;
    created_at: string;
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
                  order_items (
                    id,
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

    // Data Masking Helper
    const maskData = (text: string | undefined | null) => {
        if (!text) return '';
        if (!storeRestricted) return text;

        // Simple masking: Keep first and last char, mask middle
        return text.split(' ').map(word => {
            if (word.length <= 2) return '**';
            const first = word[0];
            const last = word[word.length - 1];
            return `${first}****${last}`;
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

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setDetailsOpen(true);
    };

    // Dynamic Filters
    type FilterType = 'status' | 'order_number' | 'customer_name' | 'customer_phone' | 'customer_address' | 'product_name' | 'date_range' | 'total_min' | 'total_max';

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
                    body * {
                        visibility: hidden;
                    }
                    #print-container, #print-container * {
                        visibility: visible;
                    }
                    #print-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
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
                        <Button variant="outline">
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
                                        <TableCell className="font-medium">#{order.order_number}</TableCell>
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
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {order.total} {order.currency}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewDetails(order)}
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                {language === 'ar' ? 'تفاصيل' : 'Details'}
                                            </Button>
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
                        <Button variant="ghost" size="sm" onClick={handleBulkPrint} className="text-green-700 hover:text-green-900 hover:bg-green-100">
                            <Printer className="w-4 h-4 mr-2" />
                            {language === 'ar' ? 'طباعة الطلبات المحددة' : 'Print Selected'}
                        </Button>
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
        </div>
    );
}
