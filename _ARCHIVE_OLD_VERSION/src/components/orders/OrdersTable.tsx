 import { useLanguage } from '@/contexts/LanguageContext';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Button } from '@/components/ui/button';
 import { Skeleton } from '@/components/ui/skeleton';
 import { OrderStatusBadge } from './OrderStatusBadge';
 import { Eye, Package } from 'lucide-react';
 import { format } from 'date-fns';
 import { ar, enUS } from 'date-fns/locale';
 import type { Tables } from '@/integrations/supabase/types';
 
 type Order = Tables<'orders'>;
 
 interface OrdersTableProps {
   orders: Order[];
   currency: string;
   isLoading: boolean;
   onViewOrder: (order: Order) => void;
 }
 
 export function OrdersTable({ orders, currency, isLoading, onViewOrder }: OrdersTableProps) {
   const { language } = useLanguage();
 
   const formatCurrency = (amount: number) => {
     return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
       style: 'currency',
       currency: currency,
       minimumFractionDigits: 0,
       maximumFractionDigits: 2,
     }).format(amount);
   };
 
   const formatDate = (date: string) => {
     return format(new Date(date), 'dd MMM yyyy', {
       locale: language === 'ar' ? ar : enUS,
     });
   };
 
   if (isLoading) {
     return (
       <div className="border rounded-lg">
         <Table>
           <TableHeader>
             <TableRow>
               <TableHead>{language === 'ar' ? 'رقم الطلب' : 'Order #'}</TableHead>
               <TableHead>{language === 'ar' ? 'العميل' : 'Customer'}</TableHead>
               <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
               <TableHead>{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
               <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
               <TableHead></TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {Array.from({ length: 5 }).map((_, i) => (
               <TableRow key={i}>
                 <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                 <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                 <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                 <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                 <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                 <TableCell><Skeleton className="h-8 w-8" /></TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
       </div>
     );
   }
 
   if (orders.length === 0) {
     return (
       <div className="border rounded-lg p-12 text-center">
         <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
           <Package className="w-8 h-8 text-muted-foreground" />
         </div>
         <h3 className="font-semibold text-lg mb-2">
           {language === 'ar' ? 'لا توجد طلبات' : 'No orders yet'}
         </h3>
         <p className="text-muted-foreground">
           {language === 'ar'
             ? 'ستظهر الطلبات هنا عندما يقوم العملاء بالشراء'
             : 'Orders will appear here when customers make purchases'}
         </p>
       </div>
     );
   }
 
   return (
     <div className="border rounded-lg overflow-hidden">
       <Table>
         <TableHeader>
           <TableRow>
             <TableHead>{language === 'ar' ? 'رقم الطلب' : 'Order #'}</TableHead>
             <TableHead>{language === 'ar' ? 'العميل' : 'Customer'}</TableHead>
             <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
             <TableHead>{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
             <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
             <TableHead></TableHead>
           </TableRow>
         </TableHeader>
         <TableBody>
           {orders.map((order) => {
             const customer = order.customer_snapshot as { name?: string; phone?: string } | null;
             return (
               <TableRow key={order.id}>
                 <TableCell className="font-mono font-medium">
                   #{order.order_number}
                 </TableCell>
                 <TableCell>
                   <div>
                     <p className="font-medium">{customer?.name || (language === 'ar' ? 'عميل' : 'Customer')}</p>
                     {customer?.phone && (
                       <p className="text-sm text-muted-foreground">{customer.phone}</p>
                     )}
                   </div>
                 </TableCell>
                 <TableCell>
                   <OrderStatusBadge status={order.status} />
                 </TableCell>
                 <TableCell className="font-medium">
                   {formatCurrency(Number(order.total))}
                 </TableCell>
                 <TableCell className="text-muted-foreground">
                   {formatDate(order.created_at)}
                 </TableCell>
                 <TableCell>
                   <Button
                     variant="ghost"
                     size="icon"
                     onClick={() => onViewOrder(order)}
                   >
                     <Eye className="w-4 h-4" />
                   </Button>
                 </TableCell>
               </TableRow>
             );
           })}
         </TableBody>
       </Table>
     </div>
   );
 }