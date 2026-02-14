 import { Badge } from '@/components/ui/badge';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { Clock, CheckCircle, Package, Truck, Home, XCircle } from 'lucide-react';
 
 interface OrderStatusBadgeProps {
   status: string;
 }
 
 const statusConfig: Record<string, {
   labelAr: string;
   labelEn: string;
   variant: 'default' | 'secondary' | 'destructive' | 'outline';
   className: string;
   icon: React.ElementType;
 }> = {
   pending: {
     labelAr: 'قيد الانتظار',
     labelEn: 'Pending',
     variant: 'secondary',
     className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200',
     icon: Clock,
   },
   confirmed: {
     labelAr: 'مؤكد',
     labelEn: 'Confirmed',
     variant: 'secondary',
     className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200',
     icon: CheckCircle,
   },
   processing: {
     labelAr: 'قيد المعالجة',
     labelEn: 'Processing',
     variant: 'secondary',
     className: 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200',
     icon: Package,
   },
   shipped: {
     labelAr: 'تم الشحن',
     labelEn: 'Shipped',
     variant: 'secondary',
     className: 'bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200',
     icon: Truck,
   },
   delivered: {
     labelAr: 'تم التوصيل',
     labelEn: 'Delivered',
     variant: 'secondary',
     className: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200',
     icon: Home,
   },
   cancelled: {
     labelAr: 'ملغي',
     labelEn: 'Cancelled',
     variant: 'destructive',
     className: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200',
     icon: XCircle,
   },
 };
 
 export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
   const { language } = useLanguage();
   const config = statusConfig[status] || statusConfig.pending;
   const Icon = config.icon;
 
   return (
     <Badge variant="outline" className={config.className}>
       <Icon className="w-3 h-3 me-1" />
       {language === 'ar' ? config.labelAr : config.labelEn}
     </Badge>
   );
 }