export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSessionToken } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const token = await getAdminSessionToken()
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const supabase = createAdminClient()
        const { data: validation, error: valError } = await supabase.rpc('validate_super_admin_session', { p_token: token })
        if (valError || !validation?.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json() as any
        const { editingPlanId, payload, features } = body

        let targetPlanId = editingPlanId;
        let planData;

        if (editingPlanId) {
            const { error, data } = await supabase
                .from('plans')
                .update(payload)
                .eq('id', editingPlanId)
                .select()
                .single()
            if (error) throw error
            planData = data;
        } else {
            const { error, data } = await supabase
                .from('plans')
                .insert([payload])
                .select()
                .single()
            if (error) throw error
            planData = data;
            targetPlanId = data.id;
        }

        if (targetPlanId && features && Object.keys(features).length > 0) {
            const featureUpserts = Object.entries(features).map(([feature_id, value]) => ({
                plan_id: targetPlanId,
                feature_id,
                value: String(value)
            }))
            const { error: fvError } = await supabase.from('plan_feature_values').upsert(featureUpserts)
            if (fvError) throw fvError

            // Sync features JSONB on plans table (used by enforcement triggers like check_product_limit)
            const featuresJsonb: Record<string, any> = {}
            for (const [key, val] of Object.entries(features)) {
                const numVal = Number(val)
                featuresJsonb[key] = isNaN(numVal) ? val : numVal
            }
            const { error: syncError } = await supabase
                .from('plans')
                .update({ features: featuresJsonb })
                .eq('id', targetPlanId)
            if (syncError) console.error('Features JSONB sync error:', syncError)
        }

        return NextResponse.json({ success: true, data: planData })
    } catch (e: any) {
        console.error('Plan save error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const token = await getAdminSessionToken()
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const supabase = createAdminClient()
        const { data: validation, error: valError } = await supabase.rpc('validate_super_admin_session', { p_token: token })
        if (valError || !validation?.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        const action = searchParams.get('action')

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

        if (action === 'deactivate') {
            const { error } = await supabase.from('plans').update({ is_active: false }).eq('id', id)
            if (error) throw error
        } else {
            const { error } = await supabase.from('plans').delete().eq('id', id)
            if (error) throw error
        }

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error('Plan delete error:', e);
        return NextResponse.json({ error: e.message, code: e.code }, { status: 500 })
    }
}
