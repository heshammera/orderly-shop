import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from '@/contexts/LanguageContext';

interface AnalyticsChartsProps {
    revenueData: Array<{ name: string; total: number }>;
    topProductsData: Array<{ name: string; value: number; color: string }>;
    currency: string;
}

export function AnalyticsCharts({ revenueData, topProductsData, currency }: AnalyticsChartsProps) {
    const { language } = useLanguage();

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover/95 backdrop-blur-sm border rounded-lg shadow-xl p-3 text-sm animate-in fade-in-0 zoom-in-95">
                    <p className="font-medium mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color || entry.stroke || entry.fill }}
                            />
                            <span className="text-muted-foreground">
                                {entry.name === 'total'
                                    ? (language === 'ar' ? 'الإيرادات' : 'Revenue')
                                    : entry.name}:
                            </span>
                            <span className="font-bold">
                                {entry.name === 'total' || entry.name === 'value'
                                    ? new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
                                        style: 'currency',
                                        currency: currency
                                    }).format(entry.value)
                                    : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Revenue Chart - Takes 4 columns */}
            <Card className="col-span-4 bg-card/50 backdrop-blur-sm border-primary/10">
                <CardHeader>
                    <CardTitle>{language === 'ar' ? 'نمو المبيعات (آخر 30 يوم)' : 'Revenue Growth (Last 30 Days)'}</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Top Products - Takes 3 columns */}
            <Card className="col-span-3 bg-card/50 backdrop-blur-sm border-primary/10">
                <CardHeader>
                    <CardTitle>{language === 'ar' ? 'أفضل المنتجات مبيعاً' : 'Top Selling Products'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                        {topProductsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={topProductsData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {topProductsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-muted-foreground text-sm">
                                {language === 'ar' ? 'لا توجد بيانات كافية' : 'No sufficient data'}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 text-xs mt-2">
                        {topProductsData.map((item) => (
                            <div key={item.name} className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-muted-foreground truncate max-w-[100px]" title={item.name}>{item.name}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
