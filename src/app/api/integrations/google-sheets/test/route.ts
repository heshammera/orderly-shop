

import { NextRequest, NextResponse } from 'next/server';
import { checkSheetAccess } from '@/lib/google-sheets';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId, serviceAccount, sheetId, tabName } = body;

        console.log('[Sheet Test] Request received:', {
            storeId,
            sheetId,
            sheetIdLength: sheetId?.length,
            tabName,
            hasServiceAccount: !!serviceAccount,
            serviceAccountLength: serviceAccount?.length
        });

        if (!storeId || !sheetId) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Use provided service account or fall back to global platform account
        const resolvedServiceAccount = serviceAccount || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

        if (!resolvedServiceAccount) {
            return NextResponse.json(
                { success: false, message: 'No service account configured. Please contact platform admin.' },
                { status: 400 }
            );
        }

        // Log which service account email is being used
        try {
            const saObj = JSON.parse(resolvedServiceAccount);
            console.log('[Sheet Test] Using service account email:', saObj.client_email);
            console.log('[Sheet Test] Testing sheet ID:', sheetId);
        } catch (e) {
            console.log('[Sheet Test] Could not parse service account JSON');
        }

        // Check Access
        const accessResult = await checkSheetAccess(resolvedServiceAccount, sheetId);

        console.log('[Sheet Test] Access result:', accessResult);

        if (!accessResult.success) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: `Could not access the Sheet. ${accessResult.message || 'Please check the link and ensure the Service Account email has Editor access.'}`,
                    debug: { sheetId, sheetIdLength: sheetId.length }
                },
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
