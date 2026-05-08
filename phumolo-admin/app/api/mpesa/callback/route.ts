import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const data = await request.json() as Record<string, unknown>
    
    if (!data.Body?.stkCallback) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid callback data' }, { status: 400 })
    }

    const callback = data.Body.stkCallback
    const resultCode = callback.ResultCode
    const checkoutRequestID = callback.CheckoutRequestID

    // Log the raw callback to activity_logs or a dedicated table
    await supabaseAdmin.from('activity_logs').insert([{
      event_type: 'mpesa_callback',
      description: `M-Pesa callback received for ${checkoutRequestID}. ResultCode: ${resultCode}`,
      metadata: data as Record<string, unknown>
    }])

    // Extract Transaction ID
    let transaction_id = ''
    if (resultCode === 0 && callback.CallbackMetadata?.Item) {
      const item = callback.CallbackMetadata.Item.find((i: { Name: string, Value?: unknown }) => i.Name === 'MpesaReceiptNumber')
      if (item) transaction_id = item.Value as string
    }

    // 1. Check Marathon Payments
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('id, status')
      .eq('checkout_request_id', checkoutRequestID)
      .eq('status', 'pending')
      .single()

    if (payment && !paymentError) {
      if (resultCode === 0) {
        // Update payment
        await supabaseAdmin.from('payments')
          .update({ status: 'success', transaction_id, metadata: data as Record<string, unknown> })
          .eq('id', payment.id)

        // Update registration status
        await supabaseAdmin.from('registrations')
          .update({ payment_status: 'Confirmed' })
          .eq('payment_id', payment.id)
      } else {
        // Failed
        await supabaseAdmin.from('payments')
          .update({ status: 'failed', metadata: data as Record<string, unknown> })
          .eq('id', payment.id)
      }
    } else {
      // 2. Check Karura Registrations (if they use a separate table in Supabase)
      // For now, let's assume all are in 'registrations' or handle similarly.
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
  } catch (error: unknown) {
    console.error('M-Pesa Callback Error:', error)
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Internal Error' }, { status: 500 })
  }
}
