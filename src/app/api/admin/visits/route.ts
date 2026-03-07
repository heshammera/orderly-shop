import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSessionToken } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const token = await getAdminSessionToken();
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();

        // Validate admin session
        const { data: validation, error: authError } = await supabase.rpc('validate_super_admin_session', { p_token: token });
        if (authError || !validation || !validation.valid) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

        // Week start (Saturday for Arabic locale)
        const dayOfWeek = now.getDay();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - ((dayOfWeek + 1) % 7));
        weekStart.setHours(0, 0, 0, 0);
        const weekStartISO = weekStart.toISOString();

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Fetch counts in parallel
        const [dailyResult, weeklyResult, monthlyResult, chartResult] = await Promise.all([
            // Daily visits
            supabase
                .from('platform_visits')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', todayStart),

            // Weekly visits
            supabase
                .from('platform_visits')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', weekStartISO),

            // Monthly visits
            supabase
                .from('platform_visits')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', monthStart),

            // Last 30 days daily data for chart
            supabase
                .from('platform_visits')
                .select('created_at')
                .gte('created_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
                .order('created_at', { ascending: true }),
        ]);

        // Group chart data by day
        const dailyChart: Record<string, number> = {};
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            dailyChart[key] = 0;
        }

        if (chartResult.data) {
            for (const row of chartResult.data) {
                const key = new Date(row.created_at).toISOString().split('T')[0];
                if (dailyChart[key] !== undefined) {
                    dailyChart[key]++;
                }
            }
        }

        const chartData = Object.entries(dailyChart).map(([date, count]) => ({
            date,
            label: new Date(date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
            visits: count,
        }));

        return NextResponse.json({
            daily: dailyResult.count || 0,
            weekly: weeklyResult.count || 0,
            monthly: monthlyResult.count || 0,
            chartData,
        });
    } catch (error) {
        console.error('Admin visits API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
