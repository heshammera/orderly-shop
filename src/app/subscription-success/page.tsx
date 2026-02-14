"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SubscriptionSuccessPage() {
    const { language } = useLanguage();

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <Card className="w-full max-w-md text-center shadow-lg border-0">
                <CardHeader>
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                        <Clock className="w-8 h-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        {language === 'ar' ? 'تم استلام طلبك بنجاح' : 'Request Received'}
                    </CardTitle>
                    <CardDescription className="text-lg mt-2">
                        {language === 'ar'
                            ? 'تم الطلب وسيتم التفعيل خلال ساعتين.'
                            : 'Requested, will be activated within 2 hours.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-gray-600">
                        {language === 'ar'
                            ? 'تم إرسال طلبك للإدارة للمراجعة. سيقوم فريقنا بمراجعة إيصال الدفع وتفعيل حسابك في أقرب وقت.'
                            : 'Your request has been sent to the admin for review. Our team will review your payment receipt and activate your account shortly.'}
                    </p>

                    <div className="pt-4">
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/">
                                {language === 'ar' ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
