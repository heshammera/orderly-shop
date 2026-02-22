"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Lock, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProductForm } from '@/components/dashboard/ProductForm';
import { ProductDetailsDialog } from '@/components/dashboard/ProductDetailsDialog';
import { VariantEditor } from '@/components/dashboard/VariantEditor';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ProductsPage({ params }: { params: { storeId: string } }) {
    const { storeId } = params;
    const { language } = useLanguage();
    const supabase = createClient();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Usage Limit Check
    const { canAddProduct, limits, usage, isLoading: limitLoading, subscription } = useSubscription(storeId);

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (data) setProducts(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchProducts();
    }, [storeId, supabase]);

    const handleDelete = async (productId: string) => {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;

            setProducts(products.filter(p => p.id !== productId));
            toast.success('Product deleted successfully');
            setIsDeleteOpen(false);
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        }
    };

    if (loading || limitLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    const productsCount = usage?.['products_count'] || products.length;
    const isLimitReached = !canAddProduct;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        {language === 'ar' ? 'المنتجات' : 'Products'}
                    </h1>
                    <p className="text-muted-foreground">
                        {productsCount} / {limits.products === -1 ? '∞' : limits.products}
                        {language === 'ar' ? ' منتج مستخدم' : ' products used'}
                    </p>
                </div>

                {isLimitReached ? (
                    <Button disabled variant="secondary">
                        <Lock className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'ترقية الباقة للإضافة' : 'Upgrade to Add'}
                    </Button>
                ) : (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'إضافة منتج' : 'Add Product'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}</DialogTitle>
                                <DialogDescription>
                                    {language === 'ar' ? 'أدخل تفاصيل المنتج الجديد أدناه' : 'Enter the details of the new product below'}
                                </DialogDescription>
                            </DialogHeader>
                            <ProductForm
                                storeId={storeId}
                                onSuccess={() => window.location.reload()}
                            />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {isLimitReached && (
                <Alert className="bg-yellow-50 border-yellow-200">
                    <Lock className="h-4 w-4 text-yellow-600" />
                    <AlertTitle>Plan Limit Reached</AlertTitle>
                    <AlertDescription className="flex justify-between items-center">
                        <span>
                            You have reached the maximum number of products ({limits.products}) for your
                            <strong> {subscription?.plan?.name[language === 'ar' ? 'ar' : 'en']} </strong> plan.
                        </span>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/${storeId}/settings/billing`}>
                                Upgrade Plan
                            </Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{language === 'ar' ? 'الصورة' : 'Image'}</TableHead>
                            <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                            <TableHead>{language === 'ar' ? 'السعر' : 'Price'}</TableHead>
                            <TableHead>{language === 'ar' ? 'المخزون' : 'Stock'}</TableHead>
                            <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        {product.images && (() => {
                                            try {
                                                const images = typeof product.images === 'string'
                                                    ? JSON.parse(product.images)
                                                    : product.images;
                                                return Array.isArray(images) && images[0] ? (
                                                    <img src={images[0]} alt="" className="w-full h-full object-cover" />
                                                ) : null;
                                            } catch {
                                                return typeof product.images === 'string' ? (
                                                    <img src={product.images} alt="" className="w-full h-full object-cover" />
                                                ) : null;
                                            }
                                        })()}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    {typeof product.name === 'string' ? JSON.parse(product.name)[language] || product.name : product.name[language]}
                                </TableCell>
                                <TableCell>{product.price} {product.currency}</TableCell>
                                <TableCell>{product.stock_quantity}</TableCell>
                                <TableCell>
                                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                        {product.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedProduct(product);
                                                    setIsDetailsOpen(true);
                                                }}
                                            >
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedProduct(product);
                                                    setIsEditOpen(true);
                                                }}
                                            >
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() => {
                                                    setSelectedProduct(product);
                                                    setIsDeleteOpen(true);
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <ProductDetailsDialog
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                product={selectedProduct}
                language={language as 'ar' | 'en'}
            />

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{language === 'ar' ? 'تعديل المنتج' : 'Edit Product'}</DialogTitle>
                        <DialogDescription>
                            {language === 'ar' ? 'تعديل تفاصيل المنتج الحالي' : 'Edit the details of the existing product'}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedProduct && (
                        <>
                            <ProductForm
                                storeId={storeId}
                                initialData={selectedProduct}
                                onSuccess={() => {
                                    setIsEditOpen(false);
                                    fetchProducts();
                                }}
                                onCancel={() => setIsEditOpen(false)}
                            />
                            <VariantEditor productId={selectedProduct.id} />
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{language === 'ar' ? 'حذف المنتج' : 'Delete Product'}</DialogTitle>
                        <DialogDescription>
                            {language === 'ar'
                                ? 'هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.'
                                : 'Are you sure you want to delete this product? This action cannot be undone.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-4 mt-4">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => selectedProduct && handleDelete(selectedProduct.id)}>
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
