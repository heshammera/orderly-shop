import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, KeyRound } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SecurityTab() {
    const { language } = useLanguage();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: language === 'ar' ? 'كلمات المرور الجديدة غير متطابقة' : 'New passwords do not match',
                variant: 'destructive'
            });
            return;
        }

        if (formData.newPassword.length < 6) {
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: language === 'ar' ? 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل' : 'Password must be at least 6 characters long',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/merchant/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update password');
            }

            toast({
                title: language === 'ar' ? 'تم الحفظ' : 'Saved',
                description: language === 'ar' ? 'تم تحديث كلمة المرور بنجاح' : 'Password updated successfully',
                className: "bg-green-50 border-green-200"
            });

            // Clear form on success
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

        } catch (error: any) {
            console.error('Password update error:', error);

            // Handle common Supabase auth errors politely
            let errorMsg = error.message;
            if (errorMsg.includes('Invalid login credentials') || errorMsg.includes('current password')) {
                errorMsg = language === 'ar' ? 'كلمة المرور الحالية غير صحيحة' : 'Current password is incorrect';
            } else if (errorMsg.includes('New password should be different')) {
                errorMsg = language === 'ar' ? 'كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية' : 'New password must be different from the current one';
            }

            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: errorMsg,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
            <Alert className="bg-muted/50">
                <KeyRound className="h-4 w-4" />
                <AlertDescription className="text-sm">
                    {language === 'ar'
                        ? 'تأكد من اختيار كلمة مرور قوية تحتوي على أرقام وحروف باستخدام 6 خانات على الأقل.'
                        : 'Ensure you choose a strong password containing numbers and letters with at least 6 characters.'}
                </AlertDescription>
            </Alert>

            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="currentPassword">
                        {language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                    </Label>
                    <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        required
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        dir="ltr"
                        className="text-left"
                        autoComplete="current-password"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="newPassword">
                        {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                    </Label>
                    <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        required
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        dir="ltr"
                        className="text-left"
                        autoComplete="new-password"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">
                        {language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                    </Label>
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        dir="ltr"
                        className="text-left"
                        autoComplete="new-password"
                    />
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}
            </Button>
        </form>
    );
}
