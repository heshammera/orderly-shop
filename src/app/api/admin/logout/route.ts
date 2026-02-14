import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSessionToken, deleteAdminSession } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export async function POST() {
    try {
        const token = await getAdminSessionToken()
        if (token) {
            const supabase = createAdminClient()
            await supabase.rpc('logout_super_admin', { p_token: token })
            await deleteAdminSession()
        }
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json(
            { message: 'Error logging out' },
            { status: 500 }
        )
    }
}
