import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSessionToken } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const token = await getAdminSessionToken()
        if (!token) {
            return NextResponse.json({ user: null }, { status: 401 })
        }

        const supabase = createAdminClient()
        const { data: validation, error } = await supabase.rpc('validate_super_admin_session', { p_token: token })

        if (error || !validation || !validation.valid) {
            return NextResponse.json({ user: null }, { status: 401 })
        }

        return NextResponse.json({ user: validation.admin })
    } catch (error) {
        console.error('Admin Fetch Error:', error)
        return NextResponse.json({ user: null }, { status: 500 })
    }
}
