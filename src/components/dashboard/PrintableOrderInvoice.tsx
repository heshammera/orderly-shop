import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Phone, MapPin } from "lucide-react";

interface PrintableOrderInvoiceProps {
    order: any;
    language: string;
}

export function PrintableOrderInvoice({ order, language }: PrintableOrderInvoiceProps) {

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

    return (
        <div className="bg-white p-8 text-slate-900 border-b-2 border-dashed border-slate-300 print:border-none print:break-after-page page-break" dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
                    <h2 className="font-semibold text-lg">Social Commerce Hub</h2>
                    {/* <p className="text-sm text-muted-foreground">Store ID: {order.store_id}</p> */}
                    <p className="text-sm text-muted-foreground">{format(new Date(order.created_at), 'PPP')}</p>
                </div>
            </div>

            {/* Customer & Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        {language === 'ar' ? 'فوترة إلى' : 'Bill To'}
                    </h3>
                    <div className="space-y-2">
                        <p className="font-bold text-lg">{order.customer_snapshot?.name || 'N/A'}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span>{order.customer_snapshot?.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mt-0.5" />
                            <span>
                                {order.customer_snapshot?.address ? (
                                    typeof order.customer_snapshot.address === 'string'
                                        ? order.customer_snapshot.address
                                        : [
                                            order.customer_snapshot.address.full_address,
                                            order.customer_snapshot.address.street,
                                            order.customer_snapshot.address.city,
                                            order.customer_snapshot.address.governorate_id
                                        ].filter(Boolean).join(', ')
                                ) : 'No Address'}
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
            <div className="rounded-lg border overflow-hidden mb-8">
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
                                            {/* Images might be blocked in print, but good to keep structure */}
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
                        <span>{order.total} {order.currency}</span>
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
                <div className="border-t pt-4 mt-8">
                    <h4 className="text-sm font-semibold mb-1">{language === 'ar' ? 'ملاحظات' : 'Notes'}</h4>
                    <p className="text-sm text-muted-foreground">{order.notes}</p>
                </div>
            )}
        </div>
    );
}
