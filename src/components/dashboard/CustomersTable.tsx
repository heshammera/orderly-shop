"use client";

import { useEffect, useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Search, Download, Loader2, UserPlus, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    total_orders: number;
    total_spent: number;
    loyalty_points?: number;
    created_at: string;
}

interface Order {
    id: string;
    order_number: string;
    status: string;
    total: number;
    currency: string;
    created_at: string;
    customer_snapshot: any;
    items?: any[];
}

interface CustomersTableProps {
    storeId: string;
}

export function CustomersTable({ storeId }: CustomersTableProps) {
    const supabase = createClient();
    const { language } = useLanguage();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Track which customers are expanded
    const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
    // Track which orders are expanded
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
    // Store customer orders
    const [customerOrders, setCustomerOrders] = useState<Record<string, Order[]>>({});
    // Track loading state for orders
    const [loadingOrders, setLoadingOrders] = useState<Set<string>>(new Set());

    useEffect(() => {
        const controller = new AbortController();
        fetchCustomers(controller.signal);
        return () => controller.abort();
    }, [storeId]);

    const fetchCustomers = async (signal?: AbortSignal) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*, loyalty_points(points)')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (signal?.aborted) return;

            const { data: allOrders } = await supabase
                .from('orders')
                .select('total, status, customer_snapshot')
                .eq('store_id', storeId);

            if (signal?.aborted) return;

            const customersWithStats = (data || []).map((customer) => {
                const customerOrders = allOrders?.filter(
                    o => o.customer_snapshot?.phone === customer.phone
                ) || [];

                const completedOrders = customerOrders.filter(o =>
                    ['delivered', 'processing', 'shipped'].includes(o.status)
                );

                const totalSpent = completedOrders.reduce((sum, o) => sum + o.total, 0);

                return {
                    ...customer,
                    total_orders: customerOrders.length,
                    total_spent: totalSpent,
                    loyalty_points: customer.loyalty_points?.[0]?.points || 0
                };
            });

            setCustomers(customersWithStats);
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Error fetching customers:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerOrders = async (customerId: string, customerPhone: string) => {
        setLoadingOrders(prev => new Set(prev).add(customerId));
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id,
                    order_number,
                    status,
                    total,
                    currency,
                    created_at,
                    customer_snapshot,
                    order_items (
                        id,
                        product_snapshot,
                        quantity,
                        unit_price
                    )
                `)
                .eq('store_id', storeId)
                .eq('customer_snapshot->>phone', customerPhone)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const ordersWithItems = data?.map(order => ({
                ...order,
                items: order.order_items || []
            })) || [];

            setCustomerOrders(prev => ({ ...prev, [customerId]: ordersWithItems }));
        } catch (error) {
            console.error('Error fetching customer orders:', error);
        } finally {
            setLoadingOrders(prev => {
                const newSet = new Set(prev);
                newSet.delete(customerId);
                return newSet;
            });
        }
    };

    const toggleCustomer = (customerId: string, customerPhone: string) => {
        const newExpanded = new Set(expandedCustomers);

        if (newExpanded.has(customerId)) {
            newExpanded.delete(customerId);
        } else {
            newExpanded.add(customerId);
            // Fetch orders if not already fetched
            if (!customerOrders[customerId]) {
                fetchCustomerOrders(customerId, customerPhone);
            }
        }

        setExpandedCustomers(newExpanded);
    };

    const toggleOrder = (orderId: string) => {
        const newExpanded = new Set(expandedOrders);

        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }

        setExpandedOrders(newExpanded);
    };

    const filteredCustomers = customers.filter(customer => {
        return (
            customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone?.includes(searchTerm) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const getProductName = (product: any) => {
        if (!product) return 'Unknown Product';
        if (typeof product.name === 'string') {
            try {
                const parsed = JSON.parse(product.name);
                return language === 'ar' ? parsed.ar || parsed.en : parsed.en || parsed.ar;
            } catch (e) {
                return product.name;
            }
        }
        return language === 'ar' ? product.name?.ar || product.name?.en : product.name?.en || product.name?.ar;
    };

    const STATUS_STYLES: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        processing: 'bg-blue-100 text-blue-800 border-blue-200',
        shipped: 'bg-purple-100 text-purple-800 border-purple-200',
        delivered: 'bg-green-100 text-green-800 border-green-200',
        cancelled: 'bg-red-100 text-red-800 border-red-200',
        returned: 'bg-orange-100 text-orange-800 border-orange-200',
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
            {/* Header & Search */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{language === 'ar' ? 'البحث عن العملاء' : 'Search Customers'}</CardTitle>
                        <Button size="sm">
                            <UserPlus className="w-4 h-4 mr-2" />
                            {language === 'ar' ? 'إضافة عميل' : 'Add Customer'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={language === 'ar' ? 'بحث بالاسم، الهاتف، أو البريد...' : 'Search by name, phone, or email...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Customers Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>
                            {filteredCustomers.length} {language === 'ar' ? 'عميل' : 'Customers'}
                        </CardTitle>
                        <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            {language === 'ar' ? 'تصدير' : 'Export'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>{language === 'ar' ? 'العميل' : 'Customer'}</TableHead>
                                <TableHead>{language === 'ar' ? 'الهاتف' : 'Phone'}</TableHead>
                                <TableHead>{language === 'ar' ? 'عدد الطلبات' : 'Orders'}</TableHead>
                                <TableHead>{language === 'ar' ? 'إجمالي الإنفاق' : 'Total Spent'}</TableHead>
                                <TableHead>{language === 'ar' ? 'النقاط' : 'Points'}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        {language === 'ar' ? 'لا يوجد عملاء' : 'No customers found'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCustomers.map((customer) => {
                                    const isExpanded = expandedCustomers.has(customer.id);
                                    const orders = customerOrders[customer.id] || [];
                                    const isLoadingOrders = loadingOrders.has(customer.id);

                                    return (
                                        <>
                                            <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50">
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleCustomer(customer.id, customer.phone)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                                <TableCell onClick={() => toggleCustomer(customer.id, customer.phone)}>
                                                    <div>
                                                        <div className="font-medium">{customer.name}</div>
                                                        {customer.email && (
                                                            <div className="text-sm text-muted-foreground">{customer.email}</div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell onClick={() => toggleCustomer(customer.id, customer.phone)}>{customer.phone}</TableCell>
                                                <TableCell onClick={() => toggleCustomer(customer.id, customer.phone)}>
                                                    <Badge variant="secondary">{customer.total_orders}</Badge>
                                                </TableCell>
                                                <TableCell onClick={() => toggleCustomer(customer.id, customer.phone)} className="font-semibold">
                                                    {customer.total_spent.toFixed(2)} SAR
                                                </TableCell>
                                                <TableCell onClick={() => toggleCustomer(customer.id, customer.phone)}>
                                                    <Badge variant="outline">{customer.loyalty_points || 0}</Badge>
                                                </TableCell>
                                            </TableRow>

                                            {/* Expanded Orders Section */}
                                            {isExpanded && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="bg-muted/20 p-0">
                                                        {isLoadingOrders ? (
                                                            <div className="flex justify-center py-8">
                                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                            </div>
                                                        ) : orders.length === 0 ? (
                                                            <div className="text-center py-8 text-muted-foreground">
                                                                {language === 'ar' ? 'لا توجد طلبات' : 'No orders yet'}
                                                            </div>
                                                        ) : (
                                                            <div className="p-4 space-y-2">
                                                                <h4 className="font-semibold text-sm mb-3">
                                                                    {language === 'ar' ? 'طلبات العميل' : 'Customer Orders'}
                                                                </h4>
                                                                {orders.map((order) => {
                                                                    const isOrderExpanded = expandedOrders.has(order.id);

                                                                    return (
                                                                        <div key={order.id} className="border rounded-lg bg-background">
                                                                            {/* Order Summary Row */}
                                                                            <div
                                                                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                                                                                onClick={() => toggleOrder(order.id)}
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    {isOrderExpanded ? (
                                                                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                                                    ) : (
                                                                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                                                    )}
                                                                                    <div>
                                                                                        <p className="font-medium">#{order.order_number}</p>
                                                                                        <p className="text-sm text-muted-foreground">
                                                                                            {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-3">
                                                                                    <Badge variant="outline" className={STATUS_STYLES[order.status] || ''}>
                                                                                        {order.status}
                                                                                    </Badge>
                                                                                    <p className="font-semibold">{order.total} {order.currency}</p>
                                                                                </div>
                                                                            </div>

                                                                            {/* Expanded Order Details */}
                                                                            {isOrderExpanded && (
                                                                                <div className="border-t p-4 bg-muted/30">
                                                                                    <h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                                                                        <Package className="w-4 h-4" />
                                                                                        {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
                                                                                    </h5>

                                                                                    {/* Order Items */}
                                                                                    <div className="space-y-2">
                                                                                        {order.items?.map((item: any, index: number) => {
                                                                                            const product = item.product_snapshot || {};
                                                                                            const name = getProductName(product);

                                                                                            return (
                                                                                                <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                                                                                                    <div className="flex items-center gap-3">
                                                                                                        {product.images?.[0] && (
                                                                                                            <img
                                                                                                                src={product.images[0]}
                                                                                                                alt={name}
                                                                                                                className="w-10 h-10 object-cover rounded"
                                                                                                            />
                                                                                                        )}
                                                                                                        <div>
                                                                                                            <p className="font-medium text-sm">{name}</p>
                                                                                                            <p className="text-xs text-muted-foreground">
                                                                                                                {language === 'ar' ? 'الكمية' : 'Qty'}: {item.quantity}
                                                                                                            </p>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <div className="text-right">
                                                                                                        <p className="font-medium">{item.unit_price?.toFixed(2)} {order.currency}</p>
                                                                                                        <p className="text-xs text-muted-foreground">
                                                                                                            {language === 'ar' ? 'المجموع' : 'Total'}: {(item.unit_price * item.quantity).toFixed(2)}
                                                                                                        </p>
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
