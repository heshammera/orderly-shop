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

// GET: Fetch all copyright removal requests (with optional status filter)
export async function GET(request: Request) {
    try {
        const supabase = createAdminClient()
        const isAdmin = await validateAdmin(supabase)
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        let query = supabase
            .from('copyright_removal_requests')
            .select('*, store:stores(name)')
            .order('created_at', { ascending: false })

        if (status && status !== 'all') {
            query = query.eq('status', status)
        }

        const { data, error } = await query
        if (error) throw error

        return NextResponse.json({ data: data || [] })
    } catch (error: any) {
        console.error('[Copyright Requests GET] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT: Approve or reject a copyright removal request
export async function PUT(request: Request) {
    try {
        const supabase = createAdminClient()
        const isAdmin = await validateAdmin(supabase)
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, status, admin_notes } = body

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
        }

        // Update the request status
        const { error: updateError } = await supabase
            .from('copyright_removal_requests')
            .update({ status, admin_notes: admin_notes || null })
            .eq('id', id)

        if (updateError) throw updateError

        // If approved, also update the store's has_removed_copyright flag
        // (The trigger should handle this, but let's also do it explicitly for safety)
        if (status === 'approved') {
            const { data: requestData } = await supabase
                .from('copyright_removal_requests')
                .select('store_id')
                .eq('id', id)
                .single()

            if (requestData?.store_id) {
                await supabase
                    .from('stores')
                    .update({ has_removed_copyright: true })
                    .eq('id', requestData.store_id)
            }
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[Copyright Requests PUT] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
