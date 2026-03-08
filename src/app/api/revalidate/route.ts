import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const path = url.searchParams.get('path');
        const type = url.searchParams.get('type') as 'page' | 'layout' | null;

        if (!path) {
            return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
        }

        console.log(`[Revalidate API] Revalidating path: ${path} (type: ${type || 'page'})`);
        if (type) {
            revalidatePath(path, type);
        } else {
            revalidatePath(path);
        }

        return NextResponse.json({ revalidated: true, path, type });
    } catch (error: any) {
        console.error('[Revalidate API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
