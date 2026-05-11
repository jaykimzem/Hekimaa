// REQUIRED: Forces Node.js runtime on Vercel.
// Supabase SDK and body parsing both require Node.js globals.
// Edge Runtime would strip these and cause silent failures.
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    console.log('[callback] ====== CALLBACK INVOKED ======');
    console.log('[callback] Method:', req.method);
    console.log('[callback] Time:', new Date().toISOString());

    // ── ENV VAR AUDIT ────────────────────────────────────────────────────
    console.log('[callback] ENV CHECK:');
    console.log('  SUPABASE_URL :', process.env.SUPABASE_URL  ? '[SET]' : '*** UNDEFINED ***');
    console.log('  SUPABASE_KEY :', process.env.SUPABASE_KEY  ? '[SET]' : '*** UNDEFINED ***');

    // Safaricom only sends POST — but respond 200 to GET too (health check)
    if (req.method === 'GET') {
        console.log('[callback] Health check ping received.');
        return res.status(200).json({ status: 'Callback endpoint is live' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── BODY GUARD ───────────────────────────────────────────────────────
    // Vercel auto-parses application/json into req.body.
    // If Safaricom sends an unexpected shape, guard here.
    console.log('[callback] Raw body received:', JSON.stringify(req.body));

    if (!req.body || !req.body.Body || !req.body.Body.stkCallback) {
        console.error('[callback] Malformed callback body — missing Body.stkCallback');
        // Always return 200 to Safaricom to prevent retry storms
        return res.status(200).json({ status: 'Received but malformed' });
    }

    const callbackData = req.body.Body.stkCallback;
    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = callbackData;

    console.log(`[callback] CheckoutRequestID : ${CheckoutRequestID}`);
    console.log(`[callback] ResultCode        : ${ResultCode}`);
    console.log(`[callback] ResultDesc        : ${ResultDesc}`);

    // ── SUPABASE CLIENT ──────────────────────────────────────────────────
    // Instantiate inside the handler so env vars are evaluated at runtime,
    // not at module load time (which is safer in serverless environments).
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY
    );

    if (ResultCode === 0) {
        // ── TRANSACTION SUCCESSFUL ───────────────────────────────────────
        console.log('[callback] Payment SUCCESSFUL — extracting metadata...');

        const items = CallbackMetadata?.Item || [];
        const amount  = items.find(i => i.Name === 'Amount')?.Value;
        const receipt = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
        const phone   = items.find(i => i.Name === 'PhoneNumber')?.Value;

        console.log('[callback] Amount :', amount);
        console.log('[callback] Receipt:', receipt);
        console.log('[callback] Phone  :', phone);

        try {
            console.log('[callback] Writing to Supabase payments table...');
            const { data: paymentRecord, error: paymentError } = await supabase
                .from('payments')
                .insert([
                    {
                        checkout_request_id: CheckoutRequestID,
                        amount:              amount,
                        receipt_number:      receipt,
                        phone_number:        phone,
                        status:              'Completed',
                        raw_callback:        JSON.stringify(req.body)
                    }
                ]).select().single();

            if (paymentError) {
                console.error('[callback] Supabase payments insert error:', JSON.stringify(paymentError));
            }

            // ── SYNC WITH REGISTRATIONS ──────────────────────────────────────
            console.log('[callback] Syncing with registration tables...');
            
            // 1. Try Main Marathon Registrations
            const { data: regUpdate, error: regError } = await supabase
                .from('registrations')
                .update({ payment_status: 'Completed', transaction_id: receipt })
                .eq('checkout_request_id', CheckoutRequestID)
                .select();

            if (regUpdate && regUpdate.length > 0) {
                console.log('[callback] Main registration updated ✓');
            } else {
                // 2. Try Karura Registrations
                const { data: karuraUpdate, error: karuraError } = await supabase
                    .from('karura_registrations')
                    .update({ payment_status: 'success', transaction_id: receipt })
                    .eq('checkout_request_id', CheckoutRequestID)
                    .select();
                
                if (karuraUpdate && karuraUpdate.length > 0) {
                    console.log('[callback] Karura registration updated ✓');
                } else {
                    console.log('[callback] No matching registration found for CheckoutRequestID.');
                }
            }

            console.log('[callback] Supabase sync process completed ✓');
            return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });

        } catch (dbError) {
            console.error('[callback] Database update failed:', dbError.message || dbError);
            return res.status(200).json({ ResultCode: 0, ResultDesc: 'Received — DB error logged' });
        }

    } else {
        // ── TRANSACTION FAILED / CANCELLED ──────────────────────────────
        console.warn(`[callback] Payment NOT completed. Code: ${ResultCode} | Desc: ${ResultDesc}`);

        try {
            await supabase
                .from('payments')
                .insert([
                    {
                        checkout_request_id: CheckoutRequestID,
                        status:              'Failed',
                        raw_callback:        JSON.stringify(req.body)
                    }
                ]);
            
            // Update registration status to failed
            await supabase.from('registrations').update({ payment_status: 'Failed' }).eq('checkout_request_id', CheckoutRequestID);
            await supabase.from('karura_registrations').update({ payment_status: 'failed' }).eq('checkout_request_id', CheckoutRequestID);
            
            console.log('[callback] Failed payment logged to Supabase ✓');
        } catch (logErr) {
            console.error('[callback] Could not log failed payment:', logErr.message);
        }

        // Always return 200 — Safaricom retries on any non-200
        return res.status(200).json({ ResultCode: 0, ResultDesc: 'Failure logged' });
    }
}
