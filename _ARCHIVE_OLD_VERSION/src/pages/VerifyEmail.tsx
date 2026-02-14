import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';

export default function VerifyEmail() {
  const { t, language } = useLanguage();

  const ArrowIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <AuthLayout>
      <Card className="border-0 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">{t.auth.verifyEmail.title}</CardTitle>
          <CardDescription>{t.auth.verifyEmail.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-muted-foreground text-sm">
            {t.auth.verifyEmail.description}
          </div>
          {/* Use URL constructor or searchParams to preserve redirect */}
          <Link to={`/login${window.location.search}`}>
            <Button variant="outline" className="w-full">
              <ArrowIcon className="w-4 h-4" />
              {t.auth.forgotPassword.backToLogin}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
