
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { checkSheetAccess } from '@/lib/google-sheets';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId, serviceAccount, sheetId, tabName } = body;

        if (!storeId || !serviceAccount || !sheetId) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 1. Check for Duplicate Sheet ID for this store
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

        // Fetch existing integrations for this store
        // We only care about active ones or all? Probably all to avoid confusion, or at least check conflict.

        // Since we are using a JSONB config in store_integrations, we need to query it.
        // We can use the contained-in operator @> or just select and filter in JS if the volume is low.
        // Let's select all google_sheets integrations for this store.

        const { data: existingIntegrations, error: fetchError } = await supabase
            .from('store_integrations')
            .select('config')
            .eq('store_id', storeId)
            .eq('provider', 'google_sheets');

        if (fetchError) {
            console.error('Error checking duplicates:', fetchError);
            // We continue? Or fail? Let's treat it as a non-blocker for connection test but warn?
            // Better to fail safe.
            return NextResponse.json(
                { success: false, message: 'Failed to validate duplicate sheets' },
                { status: 500 }
            );
        }

        // Check for duplicates
        if (existingIntegrations && existingIntegrations.length > 0) {
            for (const integration of existingIntegrations) {
                const config = integration.config as any;
                if (config.sheet_id === sheetId) {
                    // Duplicate found!
                    // Construct a nice message.
                    let relatedTo = 'All Products';
                    if (config.mode === 'specific' && config.product_ids?.length > 0) {
                        // Ideally we would fetch the product name here, but simple "Specific Product" is okay for now,
                        // OR we can make a quick call if we want to be fancy.
                        // The user requested: "preferably mention the product name".
                        // So let's try to fetch it.
                        const productId = config.product_ids[0];
                        const { data: product } = await supabase
                            .from('products')
                            .select('name_ar, name_en')
                            .eq('id', productId)
                            .single();

                        if (product) {
                            relatedTo = product.name_ar || product.name_en || 'Product';
                        } else {
                            relatedTo = 'Unknown Product';
                        }
                    } else if (config.mode === 'include') {
                        relatedTo = 'Selected Products';
                    }

                    return NextResponse.json(
                        {
                            success: false,
                            message: `This Sheet ID is already linked to: ${relatedTo}`,
                            isDuplicate: true,
                            relatedTo
                        },
                        { status: 409 } // Conflict
                    );
                }
            }
        }

        // 2. Check Access
        const hasAccess = await checkSheetAccess(serviceAccount, sheetId);

        if (!hasAccess) {
            return NextResponse.json(
                { success: false, message: 'Could not access the Sheet. Please check the ID and ensure the Service Account has Editor access.' },
                { status: 403 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error testing Google Sheet:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
