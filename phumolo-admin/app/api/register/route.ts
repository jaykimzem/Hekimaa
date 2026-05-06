import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { MpesaService } from '@/lib/mpesa'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const data = Object.fromEntries(formData.entries())

    // 1. Map race category values from form to DB
    const raceMap: Record<string, string> = {
      '21k': '21KM',
      '10k': '10KM',
      'corporate': '5KM',
      'community': '5KM'
    }

    const race_category = raceMap[data.race_category as string] || data.race_category as string
    const phone = data.phone as string
    const amount = 500 // Marathon price

    // 2. Insert registration into Supabase
    const { data: regData, error: regError } = await supabaseAdmin.from('registrations').insert([{
      first_name: data.first_name || 'Runner',
      last_name: data.last_name || '',
      email: data.email || null,
      phone: phone,
      id_number: data.id_number || null,
      race_category: race_category,
      shirt_size: data.tshirt_size?.toString().toUpperCase() || null,
      payment_status: 'Pending'
    }]).select().single()

    if (regError) throw regError

    // 3. Create a payment record
    const reference = `HEKIMA-${Date.now()}`
    const { data: paymentData, error: paymentError } = await supabaseAdmin.from('payments').insert([{
      amount: amount,
      payment_method: 'mpesa',
      reference_id: reference,
      status: 'pending'
    }]).select().single()

    if (paymentError) throw paymentError

    // Link payment to registration
    await supabaseAdmin.from('registrations').update({ payment_id: paymentData.id }).eq('id', regData.id)

    // 4. Trigger M-Pesa STK Push
    let stkMessage = 'Registration saved.'
    try {
      const stk = await MpesaService.initiateStkPush(phone, amount, reference)
      if (stk.ResponseCode === '0') {
        stkMessage = 'STK Push initiated. Please check your phone.'
        // Update payment with checkout ID
        await supabaseAdmin.from('payments')
          .update({ checkout_request_id: stk.CheckoutRequestID })
          .eq('id', paymentData.id)
      } else {
        stkMessage = 'Registration saved, but M-Pesa push failed: ' + (stk.ResponseDescription || 'Unknown error')
      }
    } catch (stkErr: unknown) {
      console.error('STK Push Error:', stkErr)
      stkMessage = 'Registration saved, but could not trigger M-Pesa push.'
    }

    // 5. Log activity
    await supabaseAdmin.from('activity_logs').insert([{
      event_type: 'registration_initiated',
      description: `New registration started for ${data.first_name} ${data.last_name} (${data.phone}). M-Pesa: ${stkMessage}`
    }])

    return NextResponse.json({ 
      success: true, 
      message: stkMessage,
      reference: reference,
      reg_id: regData.id
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Registration error:', err)
    return NextResponse.json({ success: false, message: 'System error: ' + err.message }, { status: 500 })
  }
}
