import { ArrowDown, ArrowUp, DollarSign, Eye, ShoppingBag, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardStatsGridProps {
    stats: {
        revenue: number;
        orders: number;
        visits: number;
        conversionRate: number;
    };
    language: 'ar' | 'en';
    currency: string;
}

export function DashboardStatsGrid({ stats, language, currency }: DashboardStatsGridProps) {
    const items = [
        {
            title: language === 'ar' ? "إجمالي المبيعات" : "Total Revenue",
            value: new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(stats.revenue),
            icon: DollarSign,
            trend: "+5.2%",
            trendUp: true,
            description: language === 'ar' ? "مقارنة بالشهر الماضي" : "vs last month",
            gradient: "from-emerald-500/20 to-emerald-500/5",
            iconColor: "text-emerald-500",
            borderColor: "border-emerald-500/20"
        },
        {
            title: language === 'ar' ? "الطلبات" : "Orders",
            value: stats.orders,
            icon: ShoppingBag,
            trend: "-2.1%",
            trendUp: false,
            description: language === 'ar' ? "مقارنة بالشهر الماضي" : "vs last month",
            gradient: "from-blue-500/20 to-blue-500/5",
            iconColor: "text-blue-500",
            borderColor: "border-blue-500/20"
        },
        {
            title: language === 'ar' ? "متوسط الطلب" : "Avg. Order Value",
            value: new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(stats.visits), // using visits prop for AOV
            icon: Eye,
            trend: "+12.5%",
            trendUp: true,
            description: language === 'ar' ? "مقارنة بالشهر الماضي" : "vs last month",
            gradient: "from-purple-500/20 to-purple-500/5",
            iconColor: "text-purple-500",
            borderColor: "border-purple-500/20"
        },
        {
            title: language === 'ar' ? "معدل التحويل" : "Conversion Rate",
            value: "N/A", // Not tracked yet
            icon: ShoppingCart,
            trend: "0%",
            trendUp: true,
            description: language === 'ar' ? "قريبا..." : "Coming soon",
            gradient: "from-amber-500/20 to-amber-500/5",
            iconColor: "text-amber-500",
            borderColor: "border-amber-500/20"
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {items.map((item, index) => (
                <Card key={index} className={cn("overflow-hidden border bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50", item.borderColor)}>
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", item.gradient)} />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {item.title}
                        </CardTitle>
                        <item.icon className={cn("h-4 w-4", item.iconColor)} />
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-2xl font-bold">{item.value}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span className={cn("flex items-center font-medium", item.trendUp ? "text-green-500" : "text-red-500")}>
                                {item.trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                {item.trend}
                            </span>
                            <span>{item.description}</span>
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
