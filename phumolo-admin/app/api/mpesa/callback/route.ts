import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateBibNumber } from '@/lib/bib'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    if (!data.Body?.stkCallback) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid callback data' }, { status: 400 })
    }

    const callback = data.Body.stkCallback
    const resultCode = callback.ResultCode
    const checkoutRequestID = callback.CheckoutRequestID

    // Log the raw callback to activity_logs or a dedicated table
    await (supabaseAdmin.from('activity_logs') as any).insert([{
      event_type: 'mpesa_callback',
      description: `M-Pesa callback received for ${checkoutRequestID}. ResultCode: ${resultCode}`,
      metadata: data
    }])

    // Extract Transaction ID
    let transaction_id = ''
    if (resultCode === 0 && callback.CallbackMetadata?.Item) {
      const item = callback.CallbackMetadata.Item.find((i: any) => i.Name === 'MpesaReceiptNumber')
      if (item) transaction_id = item.Value
    }

    // 1. Check Marathon Payments
    const { data: payment, error: paymentError } = await (supabaseAdmin
      .from('payments') as any)
      .select('id, status')
      .eq('checkout_request_id', checkoutRequestID)
      .eq('status', 'pending')
      .single()

    if (payment && !paymentError) {
      if (resultCode === 0) {
        // Success
        await (supabaseAdmin.from('payments') as any)
          .update({ status: 'success', transaction_id, metadata: data })
          .eq('id', payment.id)

        // Confirm Registration
        const { data: reg, error: regError } = await (supabaseAdmin
          .from('registrations') as any)
          .select('id, race_category, user_id, users(gender)')
          .eq('payment_id', payment.id)
          .single()

        if (reg && !regError) {
          const gender = (reg.users as any)?.gender || 'Other'
          const bib = await generateBibNumber(reg.race_category, gender)
          
          await (supabaseAdmin.from('registrations') as any)
            .update({ status: 'confirmed', bib_number: bib })
            .eq('id', reg.id)
        }
      } else {
        // Failed
        await (supabaseAdmin.from('payments') as any)
          .update({ status: 'failed', metadata: data })
          .eq('id', payment.id)
      }
    } else {
      // 2. Check Karura Registrations (if they use a separate table in Supabase)
      // For now, let's assume all are in 'registrations' or handle similarly.
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
  } catch (error: any) {
    console.error('M-Pesa Callback Error:', error)
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Internal Error' }, { status: 500 })
  }
}
