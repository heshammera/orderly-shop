export const runtime = 'edge';

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

export async function DELETE(
    request: Request,
    { params }: { params: { storeId: string } }
) {
    try {
        const supabase = createAdminClient()
        const isAdmin = await validateAdmin(supabase)
        
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { storeId } = params

        if (!storeId) {
            return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
        }

        // Use admin client (bypasses RLS) to delete the store
        const { error } = await supabase
            .from('stores')
            .delete()
            .eq('id', storeId)

        if (error) {
            console.error('Delete store error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Admin delete store API error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
