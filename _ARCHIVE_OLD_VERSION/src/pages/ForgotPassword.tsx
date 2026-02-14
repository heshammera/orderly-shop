import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { t, language } = useLanguage();
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      const { error } = await resetPassword(data.email);
      if (error) {
        toast({
          title: t.common.error,
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setEmailSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const ArrowIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <AuthLayout>
      <Card className="border-0 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{t.auth.forgotPassword.title}</CardTitle>
          <CardDescription>{t.auth.forgotPassword.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-muted-foreground">{t.auth.forgotPassword.success}</p>
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  <ArrowIcon className="w-4 h-4" />
                  {t.auth.forgotPassword.backToLogin}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.auth.forgotPassword.email}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t.auth.forgotPassword.emailPlaceholder}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t.auth.forgotPassword.loading}
                      </>
                    ) : (
                      t.auth.forgotPassword.submit
                    )}
                  </Button>
                </form>
              </Form>
              <div className="mt-6 text-center">
                <Link to="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-2">
                  <ArrowIcon className="w-4 h-4" />
                  {t.auth.forgotPassword.backToLogin}
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
