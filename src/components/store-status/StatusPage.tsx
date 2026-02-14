import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type StatusType = 'unpaid' | 'maintenance' | 'banned';

interface StatusPageProps {
    type: StatusType;
    isAdminView?: boolean;
    reason?: string;
}

const statusConfig = {
    unpaid: {
        admin: {
            icon: '⚠️',
            iconBg: 'bg-red-100',
            borderColor: 'border-red-200',
            title: 'الاشتراك انتهى',
            description: 'انتهى اشتراكك، يرجى التجديد للمتابعة والوصول إلى لوحة التحكم',
            gradientFrom: 'from-red-50',
            gradientTo: 'to-orange-50',
        },
        storefront: {
            icon: '🔧',
            iconBg: 'bg-orange-100',
            borderColor: 'border-orange-200',
            title: 'المتجر تحت الصيانة',
            description: 'نقوم حالياً بأعمال الصيانة، سنعود قريباً',
            gradientFrom: 'from-orange-50',
            gradientTo: 'to-yellow-50',
        }
    },
    maintenance: {
        admin: {
            icon: '🔧',
            iconBg: 'bg-orange-100',
            borderColor: 'border-orange-200',
            title: 'المتجر تحت الصيانة',
            description: 'يقوم فريقنا حالياً بصيانة المتجر، لا يمكن العمل حالياً وسنعود قريباً',
            gradientFrom: 'from-orange-50',
            gradientTo: 'to-yellow-50',
        },
        storefront: {
            icon: '🔧',
            iconBg: 'bg-orange-100',
            borderColor: 'border-orange-200',
            title: 'المتجر تحت الصيانة',
            description: 'نقوم حالياً بأعمال الصيانة، سنعود قريباً',
            gradientFrom: 'from-orange-50',
            gradientTo: 'to-yellow-50',
        }
    },
    banned: {
        admin: {
            icon: '🚫',
            iconBg: 'bg-red-100',
            borderColor: 'border-red-300',
            title: 'تم حظر المتجر',
            description: 'تم حظر المتجر وصاحبه لانتهاك القوانين والحقوق',
            gradientFrom: 'from-red-50',
            gradientTo: 'to-red-100',
        },
        storefront: {
            icon: '🚫',
            iconBg: 'bg-red-100',
            borderColor: 'border-red-300',
            title: 'المتجر محظور',
            description: 'تم حظر هذا المتجر لانتهاك القوانين والحقوق',
            gradientFrom: 'from-red-50',
            gradientTo: 'to-red-100',
        }
    }
};

export function StatusPage({ type, isAdminView = false, reason }: StatusPageProps) {
    // For storefront unpaid, show as maintenance
    const effectiveType = !isAdminView && type === 'unpaid' ? 'maintenance' : type;
    const view = isAdminView ? 'admin' : 'storefront';
    const config = statusConfig[effectiveType][view];

    return (
        <div className={`min-h-screen bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} flex items-center justify-center p-4`}>
            <Card className={`w-full max-w-2xl shadow-2xl ${config.borderColor} border-2 backdrop-blur-sm bg-white/90`}>
                <CardHeader className="text-center pb-4 space-y-4">
                    <div className={`mx-auto ${config.iconBg} p-6 rounded-2xl mb-2 w-fit shadow-lg`}>
                        <div className="text-6xl">{config.icon}</div>
                    </div>
                    <CardTitle className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                        {config.title}
                    </CardTitle>
                    <CardDescription className="text-lg md:text-xl pt-2 text-gray-700 font-medium">
                        {config.description}
                    </CardDescription>
                </CardHeader>

                {reason && (
                    <CardContent className="text-center pb-6">
                        <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl text-base text-gray-800 shadow-sm">
                            <strong className="text-gray-900 font-semibold">السبب:</strong>
                            <p className="mt-2 leading-relaxed">{reason}</p>
                        </div>
                    </CardContent>
                )}

                <CardFooter className="flex justify-center flex-col gap-4 pt-4">
                    {isAdminView && type === 'unpaid' && (
                        <Button
                            className="w-full md:w-auto px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                            size="lg"
                            asChild
                        >
                            <Link href="/select-plan">تجديد الاشتراك الآن</Link>
                        </Button>
                    )}

                    {/* Always show visit store button for owners/admins to see the public view */}
                    {isAdminView && (
                        <Button
                            variant="secondary"
                            className="w-full md:w-auto px-8 py-6 text-lg font-medium shadow-md hover:shadow-lg transition-all"
                            size="lg"
                            asChild
                        >
                            <Link href="/">
                                زيارة واجهة المتجر العامة
                            </Link>
                        </Button>
                    )}

                    {!isAdminView && (
                        <Button
                            className="w-full md:w-auto px-8 py-6 text-lg font-semibold bg-gray-900 hover:bg-black text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                            size="lg"
                            asChild
                        >
                            <Link href="/dashboard">
                                دخول لوحة تحكم المتجر
                            </Link>
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        className="w-full md:w-auto px-8 py-6 text-base font-medium shadow-md hover:shadow-lg transition-all"
                        size="lg"
                        asChild
                    >
                        <Link href="mailto:support@social-commerce.com">
                            تواصل مع الدعم الفني
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
