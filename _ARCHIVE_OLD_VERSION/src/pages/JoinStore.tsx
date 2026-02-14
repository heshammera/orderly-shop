import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function JoinStore() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { session, user } = useAuth();
    const { language } = useLanguage();
    const [isProcessing, setIsProcessing] = useState(false);

    // Validate Token and Fetch Store Info
    const { data: invitation, isLoading, error } = useQuery({
        queryKey: ['invitation', token],
        queryFn: async () => {
            if (!token) throw new Error('No token provided');

            const { data, error } = await supabase
                .from('store_invitations')
                .select(`
            *,
            store:stores(name, logo_url)
        `)
                .eq('token', token)
                .eq('status', 'pending')
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!token,
        retry: false
    });

    const acceptInvitationMutation = useMutation({
        mutationFn: async () => {
            if (!token) return;

            // Call the RPC function we created
            const { error } = await supabase.rpc('accept_store_invitation', {
                p_token: token
            });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success(language === 'ar' ? 'تم الانضمام للفريق بنجاح!' : 'Successfully joined the team!');
            // Navigate to the store dashboard
            if (invitation?.store_id) {
                navigate(`/store/${invitation.store_id}`);
            } else {
                navigate('/dashboard');
            }
        },
        onError: (error) => {
            toast.error(error.message || (language === 'ar' ? 'حدث خطأ أثناء الانضمام' : 'Error joining team'));
        }
    });

    const handleJoin = () => {
        if (!user) {
            // Redirect to Signup with partial auth state if needed, or just show message
            // Ideally: Navigate to /signup?redirect=/join-store?token=...
            navigate(`/signup?redirect=${encodeURIComponent(location.pathname + location.search)}`);
            return;
        }
        acceptInvitationMutation.mutate();
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !invitation) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <AlertCircle />
                            {language === 'ar' ? 'دعوة غير صالحة' : 'Invalid Invitation'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'ar'
                                ? 'هذه الدعوة قد تكون منتهية الصلاحية أو غير موجودة.'
                                : 'This invitation link may be expired or invalid.'}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full" asChild>
                            <Link to="/">{language === 'ar' ? 'العودة للرئيسية' : 'Go Home'}</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const storeName = invitation.store?.name
        ? (typeof invitation.store.name === 'string' ? JSON.parse(invitation.store.name) : invitation.store.name)[language] || (typeof invitation.store.name === 'string' ? JSON.parse(invitation.store.name) : invitation.store.name).ar
        : 'Unknown Store';

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-md w-full shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle>
                        {language === 'ar' ? 'دعوة للانضمام' : 'Invitation to Join'}
                    </CardTitle>
                    <CardDescription className="text-lg mt-2">
                        {language === 'ar' ? `لقد تمت دعوتك للانضمام إلى فريق **${storeName}**` : `You have been invited to join **${storeName}** team`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg text-center">
                        <p className="text-sm font-medium text-muted-foreground uppercase">{language === 'ar' ? 'الدور المقترح' : 'Assigned Role'}</p>
                        <p className="text-xl font-bold capitalize text-primary mt-1">{invitation.role}</p>
                    </div>

                    {!user && (
                        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
                            {language === 'ar'
                                ? 'يجب عليك تسجيل الدخول أو إنشاء حساب أولاً لقبول الدعوة.'
                                : 'You need to log in or create an account to accept this invitation.'}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    {user ? (
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleJoin}
                            disabled={acceptInvitationMutation.isPending}
                        >
                            {acceptInvitationMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {language === 'ar' ? `انضمام بصفتك ${user.email}` : `Join as ${user.email}`}
                        </Button>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <Button variant="outline" asChild>
                                <Link to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}>
                                    {language === 'ar' ? 'تسجيل الدخول' : 'Log In'}
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link to={`/signup?redirect=${encodeURIComponent(location.pathname + location.search)}`}>
                                    {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
                                </Link>
                            </Button>
                        </div>
                    )}

                    {user && (
                        <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
                            {language === 'ar' ? 'ليس أنت؟ تسجيل الخروج' : 'Not you? Log out'}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
