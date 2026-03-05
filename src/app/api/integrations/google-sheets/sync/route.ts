import { NextRequest, NextResponse } from 'next/server';
import { syncOrderToGoogleSheets } from '@/lib/integrations/google-sheets-sync';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, storeId } = body;

        if (!orderId || !storeId) {
            return NextResponse.json(
                { success: false, message: 'Missing orderId or storeId' },
                { status: 400 }
            );
        }

        const result = await syncOrderToGoogleSheets(orderId, storeId);

        if (!result.success) {
            return NextResponse.json(result, { status: result.message?.includes('balance') ? 402 : 500 });
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error in sync API:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
