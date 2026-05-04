'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, ShieldAlert, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
    const { language } = useLanguage();
    const router = useRouter();
    
    // Auth Challenge State
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [masterSecret, setMasterSecret] = useState('');
    const [showSecret, setShowSecret] = useState(false);
    
    // Password Change State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChallengeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (masterSecret === 'smsm.tota.hesho') {
            setIsAuthorized(true);
            toast.success(language === 'ar' ? 'تم التحقق بنجاح!' : 'Verified successfully!');
        } else {
            toast.error(language === 'ar' ? 'الكلمة السرية غير صحيحة' : 'Incorrect master secret');
        }
    };

    const handleCancelChallenge = () => {
        router.push('/admin');
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newPassword || !confirmPassword) {
            toast.error(language === 'ar' ? 'الرجاء تعبئة جميع الحقول' : 'Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/admin/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Still send masterSecret to backend for true security
                body: JSON.stringify({ newPassword, masterSecret }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'فشل في تغيير كلمة المرور');
            }

            toast.success(language === 'ar' ? 'تم تغيير كلمة المرور بنجاح!' : 'Password changed successfully!');
            setNewPassword('');
            setConfirmPassword('');
            // Optional: reset auth state after success
            // setIsAuthorized(false);
            // setMasterSecret('');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- VIEW 1: Challenge View ---
    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md border-t-4 border-t-red-500 shadow-lg">
                    <CardHeader className="text-center space-y-2">
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2">
                            <Lock className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl">
                            {language === 'ar' ? 'منطقة محظورة' : 'Restricted Area'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'ar' 
                                ? 'يجب إدخال الكلمة السرية (Master Secret) للمالك للدخول إلى إعدادات الأمان.' 
                                : 'You must enter the Owner Master Secret to access security settings.'}
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleChallengeSubmit}>
                        <CardContent className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="masterSecret">
                                    {language === 'ar' ? 'الكلمة السرية' : 'Master Secret'}
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="masterSecret"
                                        type={showSecret ? 'text' : 'password'}
                                        value={masterSecret}
                                        onChange={(e) => setMasterSecret(e.target.value)}
                                        required
                                        className="text-right pr-10"
                                        dir="ltr"
                                        placeholder="••••••••••••"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                    >
                                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={handleCancelChallenge}>
                                {language === 'ar' ? 'إلغاء والعودة' : 'Cancel & Return'}
                            </Button>
                            <Button type="submit" variant="destructive" className="flex-1">
                                {language === 'ar' ? 'دخول' : 'Enter'} <ArrowRight className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0 rtl:rotate-180" />
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        );
    }

    // --- VIEW 2: Authorized Settings View ---
    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold">
                    {language === 'ar' ? 'إعدادات الأمان' : 'Security Settings'}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {language === 'ar' 
                        ? 'إدارة كلمة مرور حساب السوبر أدمن الخاص بك.' 
                        : 'Manage your Super Admin account password.'}
                </p>
            </div>

            <Card className="border-t-4 border-t-primary">
                <CardHeader>
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <ShieldAlert className="w-5 h-5" />
                        <CardTitle className="text-lg">
                            {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                        </CardTitle>
                    </div>
                </CardHeader>
                <form onSubmit={handleChangePassword}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">
                                {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="text-right pr-10"
                                    dir="ltr"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                                {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="text-right pr-10"
                                    dir="ltr"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2" /> {language === 'ar' ? 'جاري التحديث...' : 'Updating...'}</>
                            ) : (
                                language === 'ar' ? 'حفظ كلمة المرور' : 'Save Password'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
