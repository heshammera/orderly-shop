

import { NextRequest, NextResponse } from 'next/server';
import { checkSheetAccess } from '@/lib/google-sheets';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId, serviceAccount, sheetId, tabName } = body;

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

        // Check Access
        const hasAccess = await checkSheetAccess(resolvedServiceAccount, sheetId);

        if (!hasAccess) {
            return NextResponse.json(
                { success: false, message: 'Could not access the Sheet. Please check the link and ensure the Service Account email has Editor access.' },
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
