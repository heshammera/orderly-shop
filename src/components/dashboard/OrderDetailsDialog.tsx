"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { Printer, Package, MapPin, Phone, Mail, User } from 'lucide-react';
import { useRef } from 'react';

interface OrderDetailsDialogProps {
    order: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStatusChange?: (newStatus: string) => void;
    isRestricted?: boolean;
}

export function OrderDetailsDialog({
    order,
    open,
    onOpenChange,
    onStatusChange,
    isRestricted = false,
}: OrderDetailsDialogProps) {
    const { language } = useLanguage();
    const printRef = useRef<HTMLDivElement>(null);

    // Data Masking Helper
    const maskData = (text: string | undefined | null) => {
        if (!text) return '';
        if (!isRestricted) return text;

        return text.split(' ').map(word => {
            if (word.length <= 2) return '**';
            const first = word[0];
            const last = word[word.length - 1];
            return `${first}****${last}`;
        }).join(' ');
    };

    const handlePrint = () => {
        // ... existing print logic ...
        const printContent = printRef.current;
        if (printContent) {
            const originalContents = document.body.innerHTML;
            const printContents = printContent.innerHTML;

            // Create a temporary container for printing
            const printContainer = document.createElement('div');
            printContainer.id = 'print-container';
            printContainer.innerHTML = printContents;
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
                        padding: 20px;
                        background: white;
                    }
                    @page {
                        size: A4;
                        margin: 2cm;
                    }
                }
            `;
            document.head.appendChild(style);

            window.print();

            // Cleanup
            document.body.removeChild(printContainer);
            document.head.removeChild(style);
        }
    };

    // Helper to safely parse product name
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

    // Address Helper
    const getFormattedAddress = () => {
        const addr = order.customer_snapshot?.address;
        if (!addr) return 'No Address';

        let fullAddress = '';
        if (typeof addr === 'string') {
            fullAddress = addr;
        } else {
            fullAddress = [
                addr.full_address,
                addr.street,
                addr.city,
                addr.governorate_id
            ].filter(Boolean).join(', ');
        }

        return maskData(fullAddress);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-50/50">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>
                            {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
                        </DialogTitle>
                        {!isRestricted && (
                            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                                <Printer className="w-4 h-4" />
                                {language === 'ar' ? 'طباعة الفاتورة' : 'Print Invoice'}
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                {/* Printable Invoice Content */}
                <div ref={printRef} className="bg-white p-8 rounded-lg shadow-sm border space-y-8 text-slate-900">

                    {/* Invoice Header */}
                    <div className="flex justify-between items-start border-b pb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-primary mb-2">
                                {language === 'ar' ? 'فاتورة' : 'INVOICE'}
                            </h1>
                            <p className="text-sm text-muted-foreground">#{order.order_number}</p>
                            <div className="mt-4 space-y-1">
                                <Badge variant={
                                    order.status === 'delivered' ? 'default' :
                                        order.status === 'cancelled' ? 'destructive' : 'secondary'
                                } className="uppercase tracking-wide">
                                    {order.status}
                                </Badge>
                            </div>
                        </div>
                        <div className="text-right space-y-1">
                            {/* Placeholder Store Info - Replace with dynamic store data if available */}
                            <h2 className="font-semibold text-lg">Social Commerce Hub</h2>
                            <p className="text-sm text-muted-foreground">Store ID: {order.store_id}</p>
                            <p className="text-sm text-muted-foreground">{format(new Date(order.created_at), 'PPP')}</p>
                        </div>
                    </div>

                    {/* Customer & Order Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                {language === 'ar' ? 'فوترة إلى' : 'Bill To'}
                            </h3>
                            <div className="space-y-2">
                                <p className="font-bold text-lg">{maskData(order.customer_snapshot?.name || 'N/A')}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="w-4 h-4" />
                                    <span>{maskData(order.customer_snapshot?.phone || 'N/A')}</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <MapPin className="w-4 h-4 mt-0.5" />
                                    <span>
                                        {getFormattedAddress()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3 md:text-right">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                {language === 'ar' ? 'ملخص الدفع' : 'Payment Info'}
                            </h3>
                            <div className="space-y-1 md:space-y-2">
                                <p className="text-sm font-medium">{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}: Cash on Delivery</p>
                                <p className="text-sm">{language === 'ar' ? 'العملة' : 'Currency'}: {order.currency}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                <tr>
                                    <th className="p-4">{language === 'ar' ? 'المنتج' : 'Item'}</th>
                                    <th className="p-4 text-center">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                                    <th className="p-4 text-right">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</th>
                                    <th className="p-4 text-right">{language === 'ar' ? 'المجموع' : 'Total'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {order.items?.map((item: any, index: number) => {
                                    const product = item.product_snapshot || {};
                                    const name = getProductName(product);

                                    return (
                                        <tr key={index}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {product.images?.[0] && (
                                                        <img
                                                            src={product.images[0]}
                                                            alt={name}
                                                            className="w-10 h-10 object-cover rounded border"
                                                        />
                                                    )}
                                                    <div>
                                                        <p className="font-semibold">{name}</p>
                                                        {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">{item.quantity}</td>
                                            <td className="p-4 text-right">{item.unit_price?.toFixed(2)}</td>
                                            <td className="p-4 text-right font-medium">
                                                {(item.unit_price * item.quantity).toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section */}
                    <div className="flex justify-end">
                        <div className="w-full md:w-1/3 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                                <span>{order.total} {order.currency}</span> {/* Assuming subtotal ~= total for now if not visually separated */}
                            </div>
                            {Number(order.shipping_cost) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                                    <span>{order.shipping_cost} {order.currency}</span>
                                </div>
                            )}
                            {Number(order.discount_amount) > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
                                    <span>-{order.discount_amount} {order.currency}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                                <span className="text-primary">{order.total} {order.currency}</span>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Footer / Notes */}
                    {order.notes && (
                        <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold mb-1">{language === 'ar' ? 'ملاحظات' : 'Notes'}</h4>
                            <p className="text-sm text-muted-foreground">{order.notes}</p>
                        </div>
                    )}
                </div>

                {/* Status Actions (Non-printable) */}
                {onStatusChange && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                        {order.status === 'pending' && (
                            <Button onClick={() => onStatusChange('processing')} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                {language === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'}
                            </Button>
                        )}
                        {order.status === 'processing' && (
                            <Button onClick={() => onStatusChange('shipped')} className="flex-1 bg-purple-600 hover:bg-purple-700">
                                {language === 'ar' ? 'شحن الطلب' : 'Ship Order'}
                            </Button>
                        )}
                        {order.status === 'shipped' && (
                            <Button onClick={() => onStatusChange('delivered')} className="flex-1 bg-green-600 hover:bg-green-700">
                                {language === 'ar' ? 'تم التوصيل' : 'Mark Delivered'}
                            </Button>
                        )}
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <Button
                                variant="destructive"
                                onClick={() => onStatusChange('cancelled')}
                                className="flex-1"
                            >
                                {language === 'ar' ? 'إلغاء الطلب' : 'Cancel Order'}
                            </Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
