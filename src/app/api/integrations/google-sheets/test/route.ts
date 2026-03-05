export const runtime = 'edge';


import { NextRequest, NextResponse } from 'next/server';
import { checkSheetAccess } from '@/lib/google-sheets';
import { createAdminClient } from '@/lib/supabase/admin';

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
        const supabase = createAdminClient();

        const { data: existingIntegrations, error: fetchError } = await supabase
            .from('store_integrations')
            .select('config')
            .eq('store_id', storeId)
            .eq('provider', 'google_sheets');

        if (fetchError) {
            console.error('Error checking duplicates:', fetchError);
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
                    let relatedTo = 'All Products';
                    if (config.mode === 'specific' && config.product_ids?.length > 0) {
                        const productId = config.product_ids[0];
                        const { data: product } = await supabase
                            .from('products')
                            .select('name')
                            .eq('id', productId)
                            .single();

                        if (product) {
                            try {
                                const nameObj = typeof product.name === 'string' ? JSON.parse(product.name) : product.name;
                                relatedTo = nameObj?.ar || nameObj?.en || 'Product';
                            } catch {
                                relatedTo = 'Product';
                            }
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
