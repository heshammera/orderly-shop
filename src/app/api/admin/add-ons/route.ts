import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSessionToken } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export const runtime = 'edge';

export async function GET(req: Request) {
    try {
        const token = await getAdminSessionToken()
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const supabase = createAdminClient()
        const { data: validation } = await supabase.rpc('validate_super_admin_session', { p_token: token })
        if (!validation?.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data, error } = await supabase
            .from('add_ons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error
        return NextResponse.json(data)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const token = await getAdminSessionToken()
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const supabase = createAdminClient()
        const { data: validation } = await supabase.rpc('validate_super_admin_session', { p_token: token })
        if (!validation?.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { id, ...payload } = body

        if (id) {
            const { data, error } = await supabase
                .from('add_ons')
                .update(payload)
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return NextResponse.json(data)
        } else {
            const { data, error } = await supabase
                .from('add_ons')
                .insert([payload])
                .select()
                .single()
            if (error) throw error
            return NextResponse.json(data)
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const token = await getAdminSessionToken()
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const supabase = createAdminClient()
        const { data: validation } = await supabase.rpc('validate_super_admin_session', { p_token: token })
        if (!validation?.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

        const { error } = await supabase.from('add_ons').delete().eq('id', id)
        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
