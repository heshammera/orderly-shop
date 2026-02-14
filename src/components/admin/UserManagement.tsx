"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Search, MoreHorizontal, UserX, UserCheck, Trash2, Eye, ShieldAlert, Store as StoreIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function UserManagement() {
    const { language } = useLanguage();
    const supabase = createClient();
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [detailsUser, setDetailsUser] = useState<any>(null); // For Details Dialog
    const [banUser, setBanUser] = useState<any>(null); // For Ban Dialog
    const [deleteUser, setDeleteUser] = useState<any>(null); // For Delete Dialog

    const [banReason, setBanReason] = useState('');

    // Fetch Users
    const { data: usersData, isLoading } = useQuery({
        queryKey: ['admin-users', page, searchTerm],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_all_users_paginated', {
                p_page: page,
                p_limit: 10,
                p_search: searchTerm || null,
                p_status: 'all'
            });
            if (error) throw error;
            return data;
        },
    });

    const users = usersData?.data || [];
    const totalPages = usersData ? Math.ceil(usersData.total / usersData.limit) : 0;

    // Mutations
    const banMutation = useMutation({
        mutationFn: async ({ id, reason }: { id: string, reason: string }) => {
            const { error } = await supabase.rpc('admin_ban_account', {
                p_user_id: id,
                p_reason: reason
            });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success(language === 'ar' ? 'تم حظر الحساب بنجاح' : 'Account banned successfully');
            setBanUser(null);
            setBanReason('');
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (err) => toast.error(err.message)
    });

    const unbanMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.rpc('admin_unban_account', { p_user_id: id });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success(language === 'ar' ? 'تم إلغاء الحظر بنجاح' : 'Account unbanned successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (err) => toast.error(err.message)
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch('/api/admin/users/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete user');
            }
        },
        onSuccess: () => {
            toast.success(language === 'ar' ? 'تم حذف الحساب نهائياً' : 'Account deleted permanently');
            setDeleteUser(null);
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (err) => toast.error(err.message)
    });

    const handleBanSubmit = () => {
        if (!banUser) return;
        banMutation.mutate({ id: banUser.user_id, reason: banReason });
    };

    const handleDeleteSubmit = () => {
        if (!deleteUser) return;
        deleteMutation.mutate(deleteUser.user_id);
    }

    const safeRender = (val: any) => {
        if (typeof val === 'object' && val !== null) {
            return language === 'ar' ? val.ar || val.en : val.en || val.ar;
        }
        return val;
    };


    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="flex items-center gap-4 bg-background p-4 rounded-lg border shadow-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={language === 'ar' ? 'بحث (اسم، بريد، هاتف)...' : 'Search (Name, Email, Phone)...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-background rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{language === 'ar' ? 'المستخدم' : 'User'}</TableHead>
                            <TableHead>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                            <TableHead>{language === 'ar' ? 'المتاجر' : 'Stores'}</TableHead>
                            <TableHead>{language === 'ar' ? 'تاريخ الانضمام' : 'Joined'}</TableHead>
                            <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                            <TableHead className="text-end">{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</TableCell>
                            </TableRow>
                        ) : users.map((user: any) => (
                            <TableRow key={user.user_id}>
                                <TableCell>
                                    <div className="font-medium">{user.full_name || 'N/A'}</div>
                                    <div className="text-xs text-muted-foreground">{user.phone}</div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="gap-1">
                                        <StoreIcon className="w-3 h-3" />
                                        {user.total_stores}
                                    </Badge>
                                </TableCell>
                                <TableCell>{format(new Date(user.created_at), 'yyyy/MM/dd')}</TableCell>
                                <TableCell>
                                    {user.is_banned ? (
                                        <Badge variant="destructive">{language === 'ar' ? 'محظور' : 'Banned'}</Badge>
                                    ) : (
                                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">{language === 'ar' ? 'نشط' : 'Active'}</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setDetailsUser(user)}>
                                                <Eye className="ml-2 h-4 w-4" /> {language === 'ar' ? 'تفاصيل المتاجر' : 'View Stores'}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {user.is_banned ? (
                                                <DropdownMenuItem onClick={() => unbanMutation.mutate(user.user_id)}>
                                                    <UserCheck className="ml-2 h-4 w-4 text-green-600" /> {language === 'ar' ? 'إلغاء الحظر' : 'Unban Account'}
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem onClick={() => setBanUser(user)}>
                                                    <UserX className="ml-2 h-4 w-4 text-orange-600" /> {language === 'ar' ? 'حظر الحساب' : 'Ban Account'}
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setDeleteUser(user)} className="text-red-600 focus:text-red-600">
                                                <Trash2 className="ml-2 h-4 w-4" /> {language === 'ar' ? 'حذف الحساب نهائياً' : 'Delete Permanently'}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex justify-center mt-4 gap-2 pb-4">
                    <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        {language === 'ar' ? 'السابق' : 'Previous'}
                    </Button>
                    <span className="flex items-center px-4 text-sm text-gray-600">
                        {language === 'ar' ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
                    </span>
                    <Button
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        {language === 'ar' ? 'التالي' : 'Next'}
                    </Button>
                </div>
            </div>

            {/* Details Dialog */}
            <Dialog open={!!detailsUser} onOpenChange={(open) => !open && setDetailsUser(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{language === 'ar' ? 'تفاصيل المستخدم والمتاجر' : 'User & Store Details'}</DialogTitle>
                        <DialogDescription>
                            {detailsUser?.full_name} ({detailsUser?.email})
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-muted p-3 rounded-lg">
                                <span className="text-muted-foreground block text-xs">{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</span>
                                <span className="font-medium">{detailsUser?.phone || '-'}</span>
                            </div>
                            <div className="bg-muted p-3 rounded-lg">
                                <span className="text-muted-foreground block text-xs">{language === 'ar' ? 'حالة الحظر' : 'Ban Status'}</span>
                                <span className={`${detailsUser?.is_banned ? 'text-red-600' : 'text-green-600'} font-medium`}>
                                    {detailsUser?.is_banned
                                        ? (language === 'ar' ? `محظور: ${detailsUser?.ban_reason}` : `Banned: ${detailsUser?.ban_reason}`)
                                        : (language === 'ar' ? 'نشط' : 'Active')}
                                </span>
                            </div>
                        </div>

                        <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2 mt-4">
                            <StoreIcon className="w-5 h-5" />
                            {language === 'ar' ? `المتاجر (${detailsUser?.total_stores})` : `Stores (${detailsUser?.total_stores})`}
                        </h3>

                        {detailsUser?.stores && detailsUser.stores.length > 0 ? (
                            <div className="grid gap-3">
                                {detailsUser.stores.map((store: any) => (
                                    <div key={store.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${store.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                <StoreIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{safeRender(store.name)}</div>
                                                <div className="text-xs text-muted-foreground">{store.slug} | {store.plan_name || 'Free'}</div>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <div className="font-medium text-sm">
                                                {store.balance} <span className="text-xs text-muted-foreground">{store.currency}</span>
                                            </div>
                                            <Badge variant={store.status === 'active' ? 'outline' : 'destructive'} className="text-xs mt-1">
                                                {store.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                {language === 'ar' ? 'لا يوجد متاجر مسجلة لهذا المستخدم.' : 'No stores found for this user.'}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Ban Confirm Dialog */}
            <Dialog open={!!banUser} onOpenChange={(open) => !open && setBanUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5" />
                            {language === 'ar' ? 'حظر حساب المستخدم' : 'Ban User Account'}
                        </DialogTitle>
                        <DialogDescription>
                            {language === 'ar'
                                ? 'سيتم حظر المستخدم وجميع متاجره المـُرتبطة به. لن يتمكن من تسجيل الدخول أو إدارة المتاجر.'
                                : 'This will ban the user and ALL their associated stores. They will not be able to login or manage stores.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>{language === 'ar' ? 'سبب الحظر' : 'Ban Reason'}</Label>
                        <Textarea
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            placeholder={language === 'ar' ? 'مثال: مخالفة شروط الاستخدام...' : 'e.g. Violation of terms...'}
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBanUser(null)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                        <Button
                            variant="destructive"
                            onClick={handleBanSubmit}
                            disabled={!banReason}
                        >
                            {language === 'ar' ? 'تأكيد الحظر' : 'Confirm Ban'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <Trash2 className="w-5 h-5" />
                            {language === 'ar' ? 'حذف الحساب نهائياً' : 'Permanent Account Deletion'}
                        </DialogTitle>
                        <DialogDescription className="font-bold text-red-500 mt-2">
                            {language === 'ar' ? '⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه!' : '⚠️ WARNING: THIS ACTION CANNOT BE UNDONE!'}
                        </DialogDescription>
                        <DialogDescription className="mt-2">
                            {language === 'ar'
                                ? `سيتم حذف المستخدم "${deleteUser?.full_name}" وجميع متاجره (${deleteUser?.total_stores}) وكل البيانات المرتبطة به نهائياً.`
                                : `User "${deleteUser?.full_name}" and all their stores (${deleteUser?.total_stores}) and data will be PERMANENTLY DELETED.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setDeleteUser(null)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                        <Button variant="destructive" onClick={handleDeleteSubmit}>
                            {deleteMutation.isPending && <span className="animate-spin mr-2">⏳</span>}
                            {language === 'ar' ? 'نعم، احذف نهائياً' : 'Yes, Delete Permanently'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
