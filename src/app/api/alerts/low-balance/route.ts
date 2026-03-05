import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        // 1. Verify CRON_SECRET to protect the endpoint
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = createAdminClient();
        const results = {
            processed: 0,
            whatsappSent: 0,
            emailSent: 0,
            errors: [] as string[]
        };

        // 2. Fetch stores needing alerts via RPC
        const { data: stores, error: fetchError } = await supabase
            .rpc('get_stores_needing_low_balance_alert');

        if (fetchError) {
            console.error('[low-balance-alert] Failed to fetch stores:', fetchError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!stores || stores.length === 0) {
            return NextResponse.json({ message: 'No stores need alerts', results });
        }

        // 3. Process each store
        for (const store of stores) {
            results.processed++;
            let whatsappSuccess = false;
            let emailSuccess = false;

            const storeNameAr = store.store_name?.ar || store.store_name?.en || 'متجرك';

            // Format dashboard URL
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://orderly-shop.com';
            const dashboardUrl = `${appUrl}/dashboard/${store.store_id}/wallet`;

            // A. Send WhatsApp if phone exists
            if (store.owner_phone) {
                try {
                    const wahaUrl = process.env.WAHA_API_URL;
                    const wahaKey = process.env.WAHA_API_KEY;

                    if (wahaUrl && wahaKey) {
                        const formattedPhone = store.owner_phone.replace(/\D/g, '') + '@c.us';

                        const messageText = `⚠️ *تنبيه رصيد منخفض | Orderly*\n\nمرحباً، رصيد متجرك ("${storeNameAr}") أصبح منخفضاً جداً!\n\n💰 الرصيد الحالي: ${Number(store.balance).toFixed(2)} ${store.currency}\n⚠️ الحد الأدنى المطلوب لاستمرار الخدمة: 2 دولار\n\nيرجى شحن المحفظة لضمان استمرار عمل المتجر واستقبال الطلبات.\n\n🔗 رابط الشحن السريع:\n${dashboardUrl}\n\n— فريق أوردلي`;

                        const wahaResponse = await fetch(`${wahaUrl}/api/sendText`, {
                            method: 'POST',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'X-Api-Key': wahaKey
                            },
                            body: JSON.stringify({
                                session: 'default',
                                chatId: formattedPhone,
                                text: messageText
                            })
                        });

                        if (wahaResponse.ok) {
                            whatsappSuccess = true;
                            results.whatsappSent++;
                        } else {
                            results.errors.push(`WAHA Error for ${store.store_id}: ${wahaResponse.status}`);
                        }
                    }
                } catch (e: any) {
                    console.error(`[low-balance-alert] WhatsApp failed for ${store.store_id}:`, e);
                    results.errors.push(`WhatsApp exception for ${store.store_id}: ${e.message}`);
                }
            }

            // B. Send Email if email exists
            if (store.owner_email) {
                try {
                    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
                    const n8nSecret = process.env.N8N_WEBHOOK_SECRET;

                    if (n8nWebhookUrl) {
                        const webhookPayload = {
                            type: 'low_balance_alert',
                            storeId: store.store_id,
                            storeName: storeNameAr,
                            balance: store.balance,
                            currency: store.currency,
                            destination: store.owner_email,
                            dashboardUrl: dashboardUrl
                        };

                        const webhookResponse = await fetch(n8nWebhookUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                ...(n8nSecret ? { 'X-Webhook-Secret': n8nSecret } : {}),
                            },
                            body: JSON.stringify(webhookPayload),
                        });

                        if (webhookResponse.ok) {
                            emailSuccess = true;
                            results.emailSent++;
                        } else {
                            results.errors.push(`n8n Error for ${store.store_id}: ${webhookResponse.status}`);
                        }
                    }
                } catch (e: any) {
                    console.error(`[low-balance-alert] Email failed for ${store.store_id}:`, e);
                    results.errors.push(`Email exception for ${store.store_id}: ${e.message}`);
                }
            }

            // C. Record the alert to prevent spam (even if delivery failed, to try again later or avoid endless loop if credentials are bad)
            // We only record if at least one attempt was made (either had phone or email)
            if (store.owner_phone || store.owner_email) {
                await supabase.from('low_balance_alerts').insert({
                    store_id: store.store_id,
                    balance_at_alert: store.balance,
                    whatsapp_sent: whatsappSuccess,
                    email_sent: emailSuccess
                });
            }

            // Add a small delay to avoid rate limiting on external APIs
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        return NextResponse.json({
            message: 'Low balance alerts processed',
            results
        });

    } catch (error: any) {
        console.error('[low-balance-alert] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
