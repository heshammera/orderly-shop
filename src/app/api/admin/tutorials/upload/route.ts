import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs'; // Use nodejs for file operations
// Increase body size limit for video uploads (e.g., to 100MB)
export const maxDuration = 60; // 60 seconds

export async function POST(req: Request) {
    try {
        // 1. Auth check
        const token = await getAdminSessionToken();
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabase = createAdminClient();
        const { data: validation, error: valError } = await supabase.rpc('validate_super_admin_session', { p_token: token });
        if (valError || !validation?.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 2. Parse form data
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Only allow videos
        if (!file.type.startsWith('video/')) {
            return NextResponse.json({ error: 'Invalid file type. Must be a video.' }, { status: 400 });
        }

        // 3. Upload to Supabase Storage
        const fileExt = file.name.split('.').pop() || 'mp4';
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `videos/${fileName}`;

        // Convert file to array buffer for Supabase
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('tutorials')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
        }

        // 4. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('tutorials')
            .getPublicUrl(filePath);

        return NextResponse.json({
            success: true,
            url: publicUrl,
            path: filePath
        });

    } catch (error: any) {
        console.error('Error uploading video:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
