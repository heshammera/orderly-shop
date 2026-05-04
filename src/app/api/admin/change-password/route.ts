export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSessionToken } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const token = await getAdminSessionToken()
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const supabase = createAdminClient()
        const { data: validation, error: valError } = await supabase.rpc('validate_super_admin_session', { p_token: token })
        
        if (valError || !validation?.valid || !validation?.admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { newPassword, masterSecret } = body

        if (!newPassword || !masterSecret) {
            return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
        }

        // --- MASTER SECRET CHECK ---
        if (masterSecret !== 'smsm.tota.hesho') {
            return NextResponse.json({ error: 'الكلمة السرية غير صحيحة، لا يمكن تغيير كلمة المرور' }, { status: 403 })
        }

        // Call the RPC to hash and save the new password
        const { error: rpcError } = await supabase.rpc('admin_change_password', {
            p_admin_id: validation.admin.id,
            p_new_password: newPassword
        })

        if (rpcError) {
            console.error('Change password RPC error:', rpcError)
            return NextResponse.json({ error: 'حدث خطأ أثناء تحديث كلمة المرور' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Admin change password API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
