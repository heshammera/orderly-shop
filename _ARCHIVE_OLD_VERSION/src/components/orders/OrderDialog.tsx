 import { useState } from 'react';
 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Separator } from '@/components/ui/separator';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { OrderStatusBadge } from './OrderStatusBadge';
 import { useToast } from '@/hooks/use-toast';
 import { format } from 'date-fns';
 import { ar, enUS } from 'date-fns/locale';
 import { MapPin, Phone, Mail, Package, Calendar, CreditCard, Truck, User } from 'lucide-react';
 import type { Tables } from '@/integrations/supabase/types';
 
 type Order = Tables<'orders'>;
 type OrderItem = Tables<'order_items'>;
 
 interface OrderDialogProps {
   order: Order | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   currency: string;
   onStatusChange?: () => void;
 }
 
 export function OrderDialog({ order, open, onOpenChange, currency, onStatusChange }: OrderDialogProps) {
   const { language } = useLanguage();
   const { toast } = useToast();
   const [updatingStatus, setUpdatingStatus] = useState(false);
 
   const { data: orderItems = [] } = useQuery({
     queryKey: ['order-items', order?.id],
     queryFn: async () => {
       if (!order?.id) return [];
       const { data, error } = await supabase
         .from('order_items')
         .select('*')
         .eq('order_id', order.id);
       if (error) throw error;
       return data as OrderItem[];
     },
     enabled: !!order?.id,
   });
 
   const formatCurrency = (amount: number) => {
     return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
       style: 'currency',
       currency: currency,
       minimumFractionDigits: 0,
       maximumFractionDigits: 2,
     }).format(amount);
   };
 
   const formatDate = (date: string) => {
     return format(new Date(date), 'dd MMM yyyy, HH:mm', {
       locale: language === 'ar' ? ar : enUS,
     });
   };
 
   const handleStatusChange = async (newStatus: string) => {
     if (!order) return;
     setUpdatingStatus(true);
     try {
       const { error } = await supabase
         .from('orders')
         .update({ status: newStatus })
         .eq('id', order.id);
 
       if (error) throw error;
 
       toast({
         title: language === 'ar' ? 'تم التحديث' : 'Updated',
         description: language === 'ar' ? 'تم تحديث حالة الطلب' : 'Order status updated',
       });
       onStatusChange?.();
     } catch (error) {
       toast({
         title: language === 'ar' ? 'خطأ' : 'Error',
         description: language === 'ar' ? 'فشل تحديث الحالة' : 'Failed to update status',
         variant: 'destructive',
       });
     } finally {
       setUpdatingStatus(false);
     }
   };
 
   if (!order) return null;
 
   const customer = order.customer_snapshot as { name?: string; phone?: string; email?: string } | null;
   const shippingAddress = order.shipping_address as {
     street?: string;
     city?: string;
     state?: string;
     country?: string;
     postal_code?: string;
   } | null;
 
   const statusOptions = [
     { value: 'pending', label: language === 'ar' ? 'قيد الانتظار' : 'Pending' },
     { value: 'confirmed', label: language === 'ar' ? 'مؤكد' : 'Confirmed' },
     { value: 'processing', label: language === 'ar' ? 'قيد المعالجة' : 'Processing' },
     { value: 'shipped', label: language === 'ar' ? 'تم الشحن' : 'Shipped' },
     { value: 'delivered', label: language === 'ar' ? 'تم التوصيل' : 'Delivered' },
     { value: 'cancelled', label: language === 'ar' ? 'ملغي' : 'Cancelled' },
   ];
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-3">
             <span>{language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}</span>
             <span className="font-mono text-muted-foreground">#{order.order_number}</span>
           </DialogTitle>
         </DialogHeader>
 
         <div className="space-y-6">
           {/* Status & Date */}
           <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
             <div className="flex items-center gap-4">
               <OrderStatusBadge status={order.status} />
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <Calendar className="w-4 h-4" />
                 {formatDate(order.created_at)}
               </div>
             </div>
             <Select
               value={order.status}
               onValueChange={handleStatusChange}
               disabled={updatingStatus}
             >
               <SelectTrigger className="w-40">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 {statusOptions.map((option) => (
                   <SelectItem key={option.value} value={option.value}>
                     {option.label}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Customer Info */}
           <div className="space-y-3">
             <h3 className="font-semibold flex items-center gap-2">
               <User className="w-4 h-4" />
               {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border rounded-lg">
               <div className="flex items-center gap-2">
                 <User className="w-4 h-4 text-muted-foreground" />
                 <span>{customer?.name || (language === 'ar' ? 'غير محدد' : 'Not specified')}</span>
               </div>
               {customer?.phone && (
                 <div className="flex items-center gap-2">
                   <Phone className="w-4 h-4 text-muted-foreground" />
                   <span dir="ltr">{customer.phone}</span>
                 </div>
               )}
               {customer?.email && (
                 <div className="flex items-center gap-2">
                   <Mail className="w-4 h-4 text-muted-foreground" />
                   <span>{customer.email}</span>
                 </div>
               )}
             </div>
           </div>
 
           {/* Shipping Address */}
           {shippingAddress && (
             <div className="space-y-3">
               <h3 className="font-semibold flex items-center gap-2">
                 <Truck className="w-4 h-4" />
                 {language === 'ar' ? 'عنوان الشحن' : 'Shipping Address'}
               </h3>
               <div className="p-4 border rounded-lg">
                 <div className="flex items-start gap-2">
                   <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                   <div>
                     {shippingAddress.street && <p>{shippingAddress.street}</p>}
                     <p>
                       {[shippingAddress.city, shippingAddress.state, shippingAddress.postal_code]
                         .filter(Boolean)
                         .join(', ')}
                     </p>
                     {shippingAddress.country && <p>{shippingAddress.country}</p>}
                   </div>
                 </div>
               </div>
             </div>
           )}
 
           {/* Order Items */}
           <div className="space-y-3">
             <h3 className="font-semibold flex items-center gap-2">
               <Package className="w-4 h-4" />
               {language === 'ar' ? 'المنتجات' : 'Items'}
             </h3>
             <div className="border rounded-lg divide-y">
               {orderItems.length === 0 ? (
                 <div className="p-4 text-center text-muted-foreground">
                   {language === 'ar' ? 'لا توجد منتجات' : 'No items'}
                 </div>
               ) : (
                 orderItems.map((item) => {
                   const product = item.product_snapshot as { 
                     name?: { ar?: string; en?: string };
                     images?: string[];
                   } | null;
                   const productName = product?.name?.[language] || product?.name?.ar || (language === 'ar' ? 'منتج' : 'Product');
                   const productImage = product?.images?.[0];
 
                   return (
                     <div key={item.id} className="flex items-center gap-4 p-4">
                       <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                         {productImage ? (
                           <img src={productImage} alt="" className="w-full h-full object-cover" />
                         ) : (
                           <Package className="w-6 h-6 text-muted-foreground" />
                         )}
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="font-medium truncate">{productName}</p>
                         <p className="text-sm text-muted-foreground">
                           {formatCurrency(Number(item.unit_price))} × {item.quantity}
                         </p>
                       </div>
                       <div className="font-medium">
                         {formatCurrency(Number(item.total_price))}
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
           </div>
 
           {/* Order Summary */}
           <div className="space-y-3">
             <h3 className="font-semibold flex items-center gap-2">
               <CreditCard className="w-4 h-4" />
               {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
             </h3>
             <div className="p-4 border rounded-lg space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">
                   {language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}
                 </span>
                 <span>{formatCurrency(Number(order.subtotal))}</span>
               </div>
               {Number(order.discount) > 0 && (
                 <div className="flex justify-between text-sm text-green-600">
                   <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
                   <span>-{formatCurrency(Number(order.discount))}</span>
                 </div>
               )}
               {Number(order.shipping_cost) > 0 && (
                 <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">
                     {language === 'ar' ? 'الشحن' : 'Shipping'}
                   </span>
                   <span>{formatCurrency(Number(order.shipping_cost))}</span>
                 </div>
               )}
               <Separator />
               <div className="flex justify-between font-semibold text-lg">
                 <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                 <span>{formatCurrency(Number(order.total))}</span>
               </div>
             </div>
           </div>
 
           {/* Notes */}
           {order.notes && (
             <div className="space-y-3">
               <h3 className="font-semibold">
                 {language === 'ar' ? 'ملاحظات' : 'Notes'}
               </h3>
               <div className="p-4 border rounded-lg bg-muted/50">
                 <p className="text-sm">{order.notes}</p>
               </div>
             </div>
           )}
         </div>
       </DialogContent>
     </Dialog>
   );
 }