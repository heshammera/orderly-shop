"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { UserPlus, Trash, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Checkbox } from '@/components/ui/checkbox';
import { createTeamMember } from '@/app/actions/team';

interface TeamManagementProps {
    storeId: string;
}

const ROLES = ['owner', 'admin', 'editor', 'support'];

export function TeamManagement({ storeId }: TeamManagementProps) {
    const supabase = createClient();
    const { language } = useLanguage();
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('editor');

    useEffect(() => {
        fetchTeamMembers();
    }, [storeId]);

    const fetchTeamMembers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .rpc('get_store_team', { p_store_id: storeId });

            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error('Error fetching team:', error);
        } finally {
            setLoading(false);
        }
    };

    const [createAccount, setCreateAccount] = useState(false);
    const [password, setPassword] = useState('');

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (createAccount && !password) {
                toast.error(language === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required');
                return;
            }

            // Call server action
            const result = await createTeamMember({
                storeId,
                email: inviteEmail,
                role: inviteRole,
                password,
                shouldCreateAccount: createAccount
            });

            if (!result.success) throw new Error(result.error);

            toast.success(language === 'ar' ? 'تم إضافة العضو بنجاح' : 'Member added successfully');
            setInviteOpen(false);
            setInviteEmail('');
            setInviteRole('editor');
            setPassword('');
            setCreateAccount(false);
            fetchTeamMembers();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    // ... rest of logic
    const handleRemoveMember = async (memberId: string) => {
        if (!confirm(language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return;

        try {
            const { error } = await supabase
                .from('store_members')
                .delete()
                .eq('id', memberId);

            if (error) throw error;
            toast.success(language === 'ar' ? 'تم الإزالة' : 'Member removed');
            fetchTeamMembers();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    // ... rest of logic

    const handleRoleChange = async (memberId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from('store_members')
                .update({ role: newRole })
                .eq('id', memberId);

            if (error) throw error;
            toast.success(language === 'ar' ? 'تم التحديث' : 'Role updated');
            fetchTeamMembers();
        } catch (error: any) {
            toast.error(error.message);
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
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>
                        {language === 'ar' ? 'أعضاء الفريق' : 'Team Members'} ({members.length})
                    </CardTitle>
                    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <UserPlus className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'دعوة عضو' : 'Invite Member'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {language === 'ar' ? 'دعوة عضو جديد' : 'Invite New Member'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleInvite} className="space-y-5 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium">
                                        {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="colleague@example.com"
                                            className="pl-9"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-sm font-medium">
                                        {language === 'ar' ? 'الدور والصلاحيات' : 'Role & Permissions'}
                                    </Label>
                                    <Select value={inviteRole} onValueChange={setInviteRole}>
                                        <SelectTrigger id="role">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLES.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        {language === 'ar'
                                            ? 'تحديد مستوى الوصول لهذا العضو.'
                                            : 'Define the access level for this member.'}
                                    </p>
                                </div>

                                <div className="rounded-lg border bg-muted/40 p-4 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            id="createAccount"
                                            checked={createAccount}
                                            onCheckedChange={(checked) => setCreateAccount(checked as boolean)}
                                            className="mt-1"
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <label
                                                htmlFor="createAccount"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {language === 'ar' ? 'إنشاء حساب وتسجيل الدخول مباشرة' : 'Create account & login credentials'}
                                            </label>
                                            <p className="text-xs text-muted-foreground">
                                                {language === 'ar'
                                                    ? 'تعيين كلمة مرور للعضو الآن بدلاً من انتظار قبوله للدعوة.'
                                                    : 'Set a password now instead of waiting for them to accept an invite.'}
                                            </p>
                                        </div>
                                    </div>

                                    {createAccount && (
                                        <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                                            <Label htmlFor="password">{language === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <Button type="submit" className="w-full" size="lg">
                                        {language === 'ar' ? 'إرسال الدعوة' : 'Send Invitation'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                            <TableHead>{language === 'ar' ? 'الدور' : 'Role'}</TableHead>
                            <TableHead>{language === 'ar' ? 'تاريخ الانضمام' : 'Joined'}</TableHead>
                            <TableHead className="text-right">{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    {language === 'ar' ? 'لا يوجد أعضاء' : 'No team members yet'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            members.map((member) => (
                                <TableRow key={member.member_id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{member.full_name}</span>
                                            <span className="text-xs text-muted-foreground">{member.email || 'N/A'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={member.role}
                                            onValueChange={(value) => handleRoleChange(member.member_id, value)}
                                            disabled={member.role === 'owner'}
                                        >
                                            <SelectTrigger className="w-[130px]">
                                                <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                                                    {member.role}
                                                </Badge>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ROLES.map((role) => (
                                                    <SelectItem key={role} value={role}>
                                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(member.joined_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {member.role !== 'owner' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveMember(member.member_id)}
                                            >
                                                <Trash className="w-4 h-4 text-destructive" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
