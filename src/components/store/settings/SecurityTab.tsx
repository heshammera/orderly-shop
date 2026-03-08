import { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
    Loader2, KeyRound, Mail, Phone,
    CheckCircle2, AlertCircle, Edit3, Send, ArrowLeft, ShieldCheck
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StoreData {
    id: string;
    contact_email: string | null;
    contact_phone: string | null;
    contact_email_verified?: boolean;
    contact_phone_verified?: boolean;
    name?: { ar: string; en: string };
    description?: { ar: string; en: string };
    slug?: string;
    custom_domain?: string | null;
    domain_verified?: boolean;
    logo_url?: string | null;
    currency?: string;
    timezone?: string;
    settings?: any;
}

interface SecurityTabProps {
    store: StoreData;
}

type EditingField = 'email' | 'whatsapp' | null;
type VerifyStep = 'idle' | 'editing' | 'otp_sent' | 'verifying';

export function SecurityTab({ store }: SecurityTabProps) {
    const { language } = useLanguage();
    const { user } = useAuth();
    const { toast } = useToast();

    // Password Form State
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Contact Verification State (Moved from ContactTab)
    const [editingField, setEditingField] = useState<EditingField>(null);
    const [verifyStep, setVerifyStep] = useState<VerifyStep>('idle');
    const [newValue, setNewValue] = useState('');
    const [contactLoading, setContactLoading] = useState(false);
    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const [currentEmail, setCurrentEmail] = useState(user?.email || store.contact_email || '');
    const [currentPhone, setCurrentPhone] = useState(user?.phone || store.contact_phone || '');
    const [emailVerified, setEmailVerified] = useState(!!(user?.email && user?.email_confirmed_at) || store.contact_email_verified || false);
    const [phoneVerified, setPhoneVerified] = useState(!!(user?.phone && user?.phone_confirmed_at) || store.contact_phone_verified || false);

    // Sync state if user object updates
    useEffect(() => {
        if (user) {
            if (user.email) setCurrentEmail(user.email);
            if (user.phone) setCurrentPhone(user.phone);
            if (user.email && user.email_confirmed_at) setEmailVerified(true);
            if (user.phone && user.phone_confirmed_at) setPhoneVerified(true);
        }
    }, [user]);

    // Timer countdown
    useEffect(() => {
        if (timer <= 0) return;
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timer]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Start editing
    const startEdit = (field: EditingField) => {
        setEditingField(field);
        setVerifyStep('editing');
        setNewValue('');
        setOtp(['', '', '', '', '', '']);
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditingField(null);
        setVerifyStep('idle');
        setNewValue('');
        setOtp(['', '', '', '', '', '']);
        setTimer(0);
    };

    // Request change (send OTP)
    const requestChange = useCallback(async () => {
        if (!editingField || !newValue || !user) return;

        setContactLoading(true);
        try {
            const response = await fetch('/api/merchant/update-contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'request_change',
                    storeId: store.id,
                    field: editingField,
                    newValue,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                let errorMsg = result.message || result.error;
                if (result.error === 'daily_limit_exceeded') {
                    errorMsg = language === 'ar'
                        ? 'عفواً، لقد تجاوزت الحد المسموح به لعدد المحاولات اليومية. يرجى المحاولة لاحقاً.'
                        : 'Daily limit exceeded. Please try again later.';
                }

                toast({
                    title: language === 'ar' ? 'خطأ' : 'Error',
                    description: errorMsg,
                    variant: 'destructive',
                });
                return;
            }

            setVerifyStep('otp_sent');
            setTimer(result.expiresIn || 300);
            toast({
                title: language === 'ar' ? 'تم الإرسال' : 'Code Sent',
                description: language === 'ar'
                    ? `تم إرسال كود التفعيل إلى ${editingField === 'whatsapp' ? 'واتساب' : 'بريدك الإلكتروني'}`
                    : `Verification code sent to your ${editingField === 'whatsapp' ? 'WhatsApp' : 'email'}`,
                className: 'bg-green-50 border-green-200',
            });
        } catch (error) {
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: language === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setContactLoading(false);
        }
    }, [editingField, newValue, user, store.id, language, toast]);

    // Verify OTP
    const verifyOtp = useCallback(async () => {
        const code = otp.join('');
        if (code.length !== 6 || !editingField) return;

        setContactLoading(true);
        setVerifyStep('verifying');
        try {
            const response = await fetch('/api/merchant/update-contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'verify_change',
                    storeId: store.id,
                    field: editingField,
                    code,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                setVerifyStep('otp_sent');
                toast({
                    title: language === 'ar' ? 'خطأ' : 'Error',
                    description: result.message || result.error,
                    variant: 'destructive',
                });
                return;
            }

            // Success! Update local state
            if (editingField === 'email') {
                setCurrentEmail(result.newValue || newValue);
                setEmailVerified(true);
            } else {
                setCurrentPhone(result.newValue || newValue);
                setPhoneVerified(true);
            }

            toast({
                title: language === 'ar' ? 'تم التفعيل ✅' : 'Verified ✅',
                description: language === 'ar'
                    ? `تم تحديث ${editingField === 'email' ? 'البريد الإلكتروني' : 'رقم الواتساب'} بنجاح`
                    : `${editingField === 'email' ? 'Email' : 'WhatsApp number'} updated successfully`,
                className: 'bg-green-50 border-green-200',
            });

            cancelEdit();
        } catch (error) {
            setVerifyStep('otp_sent');
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description: language === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setContactLoading(false);
        }
    }, [otp, editingField, store.id, language, toast, newValue]);

    // OTP input handlers
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits entered
        if (value && index === 5 && newOtp.every((d) => d !== '')) {
            setTimeout(() => verifyOtp(), 100);
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            setTimeout(() => verifyOtp(), 100);
        }
    };

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

        setPasswordLoading(true);

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
            setPasswordLoading(false);
        }
    };

    // Verification badge
    const VerificationBadge = ({ verified }: { verified: boolean }) => (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${verified
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
            {verified ? (
                <>
                    <CheckCircle2 className="w-3 h-3" />
                    {language === 'ar' ? 'مُفعّل' : 'Verified'}
                </>
            ) : (
                <>
                    <AlertCircle className="w-3 h-3" />
                    {language === 'ar' ? 'غير مُفعّل' : 'Not Verified'}
                </>
            )}
        </span>
    );

    // Contact field display
    const ContactField = ({
        field,
        icon: Icon,
        label,
        value,
        verified,
        placeholder,
    }: {
        field: 'email' | 'whatsapp';
        icon: any;
        label: string;
        value: string;
        verified: boolean;
        placeholder: string;
    }) => {
        const isEditing = editingField === field;

        return (
            <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        <Icon className="w-4 h-4" />
                        {label}
                    </Label>
                    <VerificationBadge verified={verified} />
                </div>

                {/* Current Value Display */}
                {!isEditing && (
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                            {value ? (
                                <p className="text-sm font-mono bg-muted/50 rounded px-3 py-2" dir="ltr">
                                    {value}
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground italic px-3 py-2">
                                    {language === 'ar' ? 'لم يتم التعيين' : 'Not set'}
                                </p>
                            )}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(field)}
                            className="shrink-0"
                        >
                            <Edit3 className="w-3 h-3 me-1" />
                            {language === 'ar' ? 'تغيير' : 'Change'}
                        </Button>
                    </div>
                )}

                {/* Edit Mode */}
                {isEditing && verifyStep === 'editing' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                                {field === 'email'
                                    ? (language === 'ar' ? 'البريد الإلكتروني الجديد' : 'New Email')
                                    : (language === 'ar' ? 'رقم الواتساب الجديد' : 'New WhatsApp Number')}
                            </Label>
                            <Input
                                type={field === 'email' ? 'email' : 'tel'}
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                placeholder={field === 'email' ? 'new@email.com' : '+966 5X XXX XXXX'}
                                dir="ltr"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                onClick={requestChange}
                                disabled={contactLoading || !newValue}
                                size="sm"
                            >
                                {contactLoading ? (
                                    <Loader2 className="w-3 h-3 animate-spin me-1" />
                                ) : (
                                    <Send className="w-3 h-3 me-1" />
                                )}
                                {language === 'ar' ? 'إرسال كود التفعيل' : 'Send Verification Code'}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={cancelEdit}
                            >
                                {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* OTP Entry Mode */}
                {isEditing && (verifyStep === 'otp_sent' || verifyStep === 'verifying') && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="text-center space-y-2">
                            <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center ${field === 'whatsapp' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                                }`}>
                                {field === 'whatsapp' ? (
                                    <Phone className="w-6 h-6 text-green-600" />
                                ) : (
                                    <Mail className="w-6 h-6 text-blue-600" />
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {language === 'ar'
                                    ? `تم إرسال كود مكون من 6 أرقام إلى ${field === 'whatsapp' ? 'واتساب' : 'بريدك الإلكتروني'}`
                                    : `A 6-digit code was sent to your ${field === 'whatsapp' ? 'WhatsApp' : 'email'}`}
                            </p>
                            <p className="text-xs font-mono text-muted-foreground" dir="ltr">{newValue}</p>
                        </div>

                        {/* OTP Inputs */}
                        <div className="flex justify-center gap-2" dir="ltr">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { otpRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    onPaste={index === 0 ? handleOtpPaste : undefined}
                                    className="w-10 h-12 text-center text-lg font-bold border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                                    disabled={verifyStep === 'verifying'}
                                />
                            ))}
                        </div>

                        {/* Timer & Resend */}
                        <div className="text-center">
                            {timer > 0 ? (
                                <p className="text-xs text-muted-foreground">
                                    {language === 'ar' ? `ينتهي خلال ${formatTime(timer)}` : `Expires in ${formatTime(timer)}`}
                                </p>
                            ) : (
                                <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    onClick={requestChange}
                                    disabled={contactLoading}
                                >
                                    {language === 'ar' ? 'إعادة إرسال الكود' : 'Resend Code'}
                                </Button>
                            )}
                        </div>

                        {/* Verify & Cancel buttons */}
                        <div className="flex justify-center gap-2">
                            <Button
                                type="button"
                                onClick={verifyOtp}
                                disabled={contactLoading || otp.join('').length !== 6}
                                size="sm"
                            >
                                {contactLoading ? (
                                    <Loader2 className="w-3 h-3 animate-spin me-1" />
                                ) : (
                                    <ShieldCheck className="w-3 h-3 me-1" />
                                )}
                                {language === 'ar' ? 'تأكيد' : 'Verify'}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={cancelEdit}
                            >
                                <ArrowLeft className="w-3 h-3 me-1" />
                                {language === 'ar' ? 'رجوع' : 'Back'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-12">

            {/* Contact Info with Verification */}
            <div className="space-y-4 max-w-2xl">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        {language === 'ar' ? 'معلومات التواصل الأساسية للحساب' : 'Account Verified Contact Info'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {language === 'ar'
                            ? 'هذه هي البيانات الأساسية المرتبطة بحسابك، تغييرها يتطلب تفعيل لتأكيد ملكيتك. (هذه البيانات مخفية عن العملاء في المتجر)'
                            : 'This is the primary data linked to your account, changing it requires OTP verification. (Hidden from customers on the storefront)'}
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <ContactField
                        field="email"
                        icon={Mail}
                        label={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                        value={currentEmail}
                        verified={emailVerified}
                        placeholder="master@store.com"
                    />
                    <ContactField
                        field="whatsapp"
                        icon={Phone}
                        label={language === 'ar' ? 'رقم هاتف الحساب' : 'Account Phone Number'}
                        value={currentPhone}
                        verified={phoneVerified}
                        placeholder="+966 5X XXX XXXX"
                    />
                </div>
            </div>

            <hr className="border-border max-w-2xl" />

            {/* Password Change Form */}
            <div className="space-y-4 max-w-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
                            <KeyRound className="w-5 h-5 text-primary" />
                            {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {language === 'ar'
                                ? 'يُنصح باختيار كلمة مرور قوية تحتوي على 6 خانات على الأقل لضمان حماية حسابك.'
                                : 'It is recommended to use a strong password with at least 6 characters.'}
                        </p>
                    </div>

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

                    <Button type="submit" disabled={passwordLoading} className="w-full sm:w-auto">
                        {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
