import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs'; // Use nodejs for file operations
// Increase body size limit for video uploads (e.g., to 100MB)
export const maxDuration = 60; // 60 seconds

export async function POST(req: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    try {
        // 1. Auth check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: roleData } = await supabase.rpc('get_user_role', { user_id: user.id });
        if (roleData !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

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
