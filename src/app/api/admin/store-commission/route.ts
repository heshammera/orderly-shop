import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSessionToken } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function validateAdmin(supabase: ReturnType<typeof createAdminClient>) {
    const token = await getAdminSessionToken()
    if (!token) return false

    const { data: validation, error } = await supabase.rpc('validate_super_admin_session', { p_token: token })
    if (error || !validation || !validation.valid) return false

    return true
}

export async function PUT(request: Request) {
    try {
        const supabase = createAdminClient()
        const isAdmin = await validateAdmin(supabase)
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { store_id, commission_type, commission_value, has_unlimited_balance, has_removed_copyright } = body

        if (!store_id) {
            return NextResponse.json({ error: 'store_id is required' }, { status: 400 })
        }

        const { error } = await supabase.from('stores').update({
            commission_type,
            commission_value,
            has_unlimited_balance,
            has_removed_copyright
        }).eq('id', store_id)

        if (error) {
            console.error('Update commission error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Admin commission API error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
