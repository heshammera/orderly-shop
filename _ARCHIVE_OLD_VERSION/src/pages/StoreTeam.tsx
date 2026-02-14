import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, UserPlus, Trash2, Shield, Copy, Check, AlertTriangle, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreRole } from '@/hooks/useStoreRole';

export default function StoreTeam() {
    const { storeId } = useParams<{ storeId: string }>();
    const { t, language } = useLanguage();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { isAdmin, isLoading: isLoadingRole } = useStoreRole(storeId);

    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('editor');
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    // Edit Member State
    const [editingMember, setEditingMember] = useState<{ id: string, name: string, role: string, email: string } | null>(null);
    const [editRole, setEditRole] = useState('editor');

    // Add Existing User State
    const [searchEmail, setSearchEmail] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [foundUser, setFoundUser] = useState<{ id: string, email: string, full_name: string } | null>(null);

    const handleSearchUser = async () => {
        if (!searchEmail) return;
        setIsSearching(true);
        setFoundUser(null);
        try {
            const { data, error } = await supabase
                .rpc('lookup_user_by_email', { search_email: searchEmail });

            if (error) throw error;

            if (data && data.length > 0) {
                setFoundUser(data[0]);
            } else {
                setFoundUser(null);
            }
        } catch (error) {
            console.error('Error searching user:', error);
            toast.error(language === 'ar' ? 'حدث خطأ أثناء البحث' : 'Error searching user');
        } finally {
            setIsSearching(false);
        }
    };

    const addExistingMutation = useMutation({
        mutationFn: async () => {
            if (!foundUser) return;
            // Check if already a member
            const { data: existingMember } = await supabase
                .from('store_members')
                .select('id')
                .eq('store_id', storeId!)
                .eq('user_id', foundUser.id)
                .single();

            if (existingMember) {
                throw new Error(language === 'ar' ? 'المستخدم عضو بالفعل في الفريق' : 'User is already a team member');
            }

            const { error } = await supabase
                .from('store_members')
                .insert({
                    store_id: storeId!,
                    user_id: foundUser.id,
                    role: inviteRole
                });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['store-members'] });
            setIsInviteOpen(false);
            setSearchEmail('');
            setFoundUser(null);
            toast.success(language === 'ar' ? 'تم إضافة العضو بنجاح' : 'Member added successfully');
        },
        onError: (error) => {
            toast.error(error.message || (language === 'ar' ? 'حدث خطأ أثناء إضافة العضو' : 'Error adding member'));
        }
    });

    const handleAddExisting = () => {
        addExistingMutation.mutate();
    };

    // Security Check
    useEffect(() => {
        if (!isLoadingRole && !isAdmin) {
            console.log('User is not admin, would redirect usually.');
            // toast.error(language === 'ar' ? 'غير مصرح لك بالوصول لهذه الصفحة' : 'You are not authorized to access this page');
            // navigate(`/store/${storeId}`);
        }
    }, [isAdmin, isLoadingRole, navigate, storeId, language]);

    // Fetch store info
    const { data: store } = useQuery({
        queryKey: ['store', storeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('stores')
                .select('name')
                .eq('id', storeId!)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!storeId && !!isAdmin,
    });

    // Fetch team members using Secure RPC
    const { data: members = [], isLoading: isLoadingMembers, error: membersError } = useQuery({
        queryKey: ['store-members', storeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .rpc('get_store_team', { p_store_id: storeId! });

            if (error) throw error;

            return data.map(member => ({
                id: member.member_id,
                userId: member.user_id,
                role: member.role,
                email: member.email || 'Unknown',
                name: member.full_name || 'Unknown',
                joinedAt: member.joined_at
            }));
        },
        enabled: !!storeId && !!isAdmin,
    });

    // Fetch pending invitations
    const { data: invitations = [], isLoading: isLoadingInvites } = useQuery({
        queryKey: ['store-invitations', storeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('store_invitations')
                .select('*')
                .eq('store_id', storeId!)
                .eq('status', 'pending');
            if (error) throw error;
            return data;
        },
        enabled: !!storeId && !!isAdmin,
    });

    // Create Invitation Mutation
    const createInviteMutation = useMutation({
        mutationFn: async () => {
            const token = crypto.randomUUID();
            const { data, error } = await supabase
                .from('store_invitations')
                .insert({
                    store_id: storeId!,
                    email: inviteEmail,
                    role: inviteRole,
                    token,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['store-invitations'] });
            setIsInviteOpen(false);
            setInviteEmail('');
            toast.success(language === 'ar' ? 'تم إنشاء الدعوة بنجاح' : 'Invitation created successfully');
        },
        onError: (error) => {
            toast.error(language === 'ar' ? 'حدث خطأ أثناء إنشاء الدعوة' : 'Error creating invitation');
            console.error(error);
        }
    });

    // Update Member Role Mutation
    const updateRoleMutation = useMutation({
        mutationFn: async () => {
            if (!editingMember) return;
            const { error } = await supabase
                .from('store_members')
                .update({ role: editRole })
                .eq('id', editingMember.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['store-members'] });
            setEditingMember(null);
            toast.success(language === 'ar' ? 'تم تحديث الصلاحية بنجاح' : 'Role updated successfully');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    // Delete Member Mutation
    const deleteMemberMutation = useMutation({
        mutationFn: async (memberId: string) => {
            const { error } = await supabase
                .from('store_members')
                .delete()
                .eq('id', memberId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['store-members'] });
            toast.success(language === 'ar' ? 'تم حذف العضو' : 'Member removed');
        }
    });

    // Delete Invitation Mutation
    const deleteInviteMutation = useMutation({
        mutationFn: async (inviteId: string) => {
            const { error } = await supabase
                .from('store_invitations')
                .delete()
                .eq('id', inviteId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['store-invitations'] });
            toast.success(language === 'ar' ? 'تم إلغاء الدعوة' : 'Invitation cancelled');
        }
    });

    const handleCopyLink = (token: string) => {
        const link = `${window.location.origin}/join-store?token=${token}`;
        navigator.clipboard.writeText(link);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
        toast.success(language === 'ar' ? 'تم نسخ الرابط' : 'Link copied');
    };

    const openEditDialog = (member: any) => {
        setEditingMember(member);
        setEditRole(member.role);
    };

    if (isLoadingRole || (isAdmin && isLoadingMembers)) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">
                    {language === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}
                </p>
            </div>
        );
    }

    // Show error state if query failed
    if (membersError) {
        return (
            <DashboardLayout storeId={storeId!} storeName={store?.name ? (typeof store.name === 'string' ? JSON.parse(store.name) : store.name)[language] || (typeof store.name === 'string' ? JSON.parse(store.name) : store.name).ar : ''}>
                <div className="p-8 text-center text-destructive border border-destructive/20 rounded-lg bg-destructive/5">
                    <AlertTriangle className="w-10 h-10 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-2">
                        {language === 'ar' ? 'خطأ في تحميل البيانات' : 'Error Loading Data'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        {(membersError as Error).message}
                    </p>
                    <Button onClick={() => window.location.reload()}>
                        {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    if (!isAdmin) {
        return null; // Will redirect via useEffect
    }

    const storeName = store?.name
        ? (typeof store.name === 'string' ? JSON.parse(store.name) : store.name)[language] || (typeof store.name === 'string' ? JSON.parse(store.name) : store.name).ar
        : '';

    return (
        <DashboardLayout storeId={storeId!} storeName={storeName}>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {language === 'ar' ? 'فريق العمل' : 'Team Members'}
                        </h1>
                        <p className="text-muted-foreground">
                            {language === 'ar' ? 'إدارة الموظفين وصلاحياتهم (أدمن فقط)' : 'Manage your staff and their roles (Admin only)'}
                        </p>
                    </div>

                    <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'إضافة عضو جديد' : 'Add Member'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>{language === 'ar' ? 'إضافة عضو للفريق' : 'Add Team Member'}</DialogTitle>
                                <DialogDescription>
                                    {language === 'ar'
                                        ? 'يمكنك دعوة عضو جديد عبر البريد الإلكتروني أو إضافة مستخد مسجل مسبقاً.'
                                        : 'Invite a new member via email or add an existing registered user.'}
                                </DialogDescription>
                            </DialogHeader>

                            <Tabs defaultValue="invite" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="invite">{language === 'ar' ? 'دعوة جديد' : 'Invite New'}</TabsTrigger>
                                    <TabsTrigger value="existing">{language === 'ar' ? 'مستخدم مسجل' : 'Existing User'}</TabsTrigger>
                                </TabsList>

                                {/* TAB 1: INVITE NEW USER */}
                                <TabsContent value="invite" className="space-y-4 py-4">
                                    <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                                        {language === 'ar'
                                            ? 'سيتم إرسال رابط دعوة للمستخدم. عند فتح الرابط، سيقوم بإنشاء كلمة مرور وتسجيل الدخول تلقائياً.'
                                            : 'An invitation link will be sent. Upon opening, the user will set a password and be fully registered.'}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                                        </label>
                                        <Input
                                            placeholder="colleague@example.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            {language === 'ar' ? 'الصلاحية / الدور' : 'Role'}
                                        </label>
                                        <Select value={inviteRole} onValueChange={setInviteRole}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">Admin (Full Access)</SelectItem>
                                                <SelectItem value="editor">Editor (Products & Orders)</SelectItem>
                                                <SelectItem value="support">Support (Orders & Customers)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                        </Button>
                                        <Button
                                            onClick={() => createInviteMutation.mutate()}
                                            disabled={!inviteEmail || createInviteMutation.isPending}
                                        >
                                            {createInviteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            {language === 'ar' ? 'إنشاء الدعوة' : 'Send Invitation'}
                                        </Button>
                                    </DialogFooter>
                                </TabsContent>

                                {/* TAB 2: ADD EXISTING USER */}
                                <TabsContent value="existing" className="space-y-4 py-4">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder={language === 'ar' ? 'ابحث بالبريد الإلكتروني...' : 'Search by email...'}
                                            value={searchEmail}
                                            onChange={(e) => setSearchEmail(e.target.value)}
                                        />
                                        <Button onClick={handleSearchUser} disabled={isSearching || !searchEmail}>
                                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'بحث' : 'Search')}
                                        </Button>
                                    </div>

                                    {foundUser && (
                                        <div className="border rounded-lg p-4 flex justify-between items-center bg-card">
                                            <div>
                                                <p className="font-medium">{foundUser.full_name || 'No Name'}</p>
                                                <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                                            </div>
                                            <Button size="sm" onClick={handleAddExisting} disabled={addExistingMutation.isPending}>
                                                {addExistingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    )}

                                    {!foundUser && !isSearching && searchEmail && (
                                        <p className="text-sm text-muted-foreground text-center py-2">
                                            {language === 'ar' ? 'لم يتم العثور على مستخدم لهذا البريد' : 'No user found with this email'}
                                        </p>
                                    )}

                                    <div className="space-y-2 mt-4">
                                        <label className="text-sm font-medium">
                                            {language === 'ar' ? 'الصلاحية / الدور' : 'Role'}
                                        </label>
                                        <Select value={inviteRole} onValueChange={setInviteRole}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">Admin (Full Access)</SelectItem>
                                                <SelectItem value="editor">Editor (Products & Orders)</SelectItem>
                                                <SelectItem value="support">Support (Orders & Customers)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Edit Member Dialog */}
                <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{language === 'ar' ? 'تعديل صلاحيات العضو' : 'Edit Member Role'}</DialogTitle>
                            <DialogDescription>
                                {editingMember?.name} ({editingMember?.email})
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {language === 'ar' ? 'الدور الجديد' : 'New Role'}
                                </label>
                                <Select value={editRole} onValueChange={setEditRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin (Full Access)</SelectItem>
                                        <SelectItem value="editor">Editor (Products & Orders)</SelectItem>
                                        <SelectItem value="support">Support (Orders & Customers)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingMember(null)}>
                                {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button onClick={() => updateRoleMutation.mutate()} disabled={updateRoleMutation.isPending}>
                                {updateRoleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Existing Members */}
                <Card>
                    <CardHeader>
                        <CardTitle>{language === 'ar' ? 'الأعضاء الحاليين' : 'Current Members'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {members.length === 0 ? (
                            <div className="text-center text-muted-foreground p-4">
                                {language === 'ar' ? 'لا يوجد أعضاء آخرين في الفريق' : 'No other team members yet'}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className='text-right'>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                                        <TableHead className='text-right'>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                                        <TableHead className='text-right'>{language === 'ar' ? 'الدور' : 'Role'}</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.map((member: any) => (
                                        <TableRow key={member.id}>
                                            <TableCell className="font-medium text-right">{member.name}</TableCell>
                                            <TableCell className="text-right">{member.email}</TableCell>
                                            <TableCell className="text-right">
                                                <div
                                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => member.role !== 'owner' && openEditDialog(member)}
                                                >
                                                    <Badge variant="secondary">
                                                        {member.role === 'owner' ? <Shield className="w-3 h-3 mr-1 inline" /> : null}
                                                        {member.role.toUpperCase()}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {member.role !== 'owner' && (
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditDialog(member)}
                                                        >
                                                            {language === 'ar' ? 'تعديل' : 'Edit'}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:bg-destructive/10"
                                                            onClick={() => deleteMemberMutation.mutate(member.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Pending Invitations */}
                {invitations.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{language === 'ar' ? 'الدعوات المعلقة' : 'Pending Invitations'}</CardTitle>
                            <CardDescription>
                                {language === 'ar' ? 'شارك رابط الدعوة مع الموظفين للانضمام' : 'Share the invite link with users to join'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                                        <TableHead>{language === 'ar' ? 'الدور' : 'Role'}</TableHead>
                                        <TableHead>{language === 'ar' ? 'الرمز / الرابط' : 'Link'}</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invitations.map((invite: any) => (
                                        <TableRow key={invite.id}>
                                            <TableCell>{invite.email}</TableCell>
                                            <TableCell><Badge variant="outline">{invite.role}</Badge></TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <code className="bg-muted px-2 py-1 rounded text-xs select-all">
                                                        {invite.token.substring(0, 8)}...
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCopyLink(invite.token)}
                                                    >
                                                        {copiedToken === invite.token ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => deleteInviteMutation.mutate(invite.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
                {(!isAdmin || isLoadingRole) && (
                    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded shadow-lg z-50 ltr text-left" style={{ direction: 'ltr' }}>
                        <p className="font-bold">Debug Info:</p>
                        <p>Is Admin: {String(isAdmin)}</p>
                        <p>Is Loading: {String(isLoadingRole)}</p>
                        <p>Store ID: {storeId}</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
