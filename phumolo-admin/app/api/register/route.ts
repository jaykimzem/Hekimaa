// API Version: 1.1.0 - Refined BIB generation logic
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { MpesaService } from '@/lib/mpesa'
import { generateBibNumber } from '@/lib/bib'

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

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
    const phone = (data.phone as string || '').replace(/\s/g, '')
    const amount = 500
    const gender = (data.gender as string) || 'Other'

    if (!phone) {
      return NextResponse.json({ success: false, message: 'Phone number is required.' }, { status: 400 })
    }

    // 2. Generate BIB Number Immediately
    const bib = await generateBibNumber(race_category, gender)

    // 3. Insert registration into Supabase
    const { data: regData, error: regError } = await supabaseAdmin.from('registrations').insert([{
      first_name: data.first_name || 'Runner',
      last_name: data.last_name || '',
      email: data.email || null,
      phone: phone,
      id_number: data.id_number || null,
      race_category: race_category,
      gender: gender,
      bib_number: bib,
      shirt_size: data.tshirt_size?.toString().toUpperCase() || 'M',
      payment_status: 'Pending'
    }]).select().single()

    if (regError) {
      console.error('Registration Insert Error:', regError)
      throw new Error('Database Error: ' + regError.message)
    }

    // 4. Create a payment record
    const reference = `HEKIMA-${Date.now()}`
    const { data: paymentData, error: paymentError } = await supabaseAdmin.from('payments').insert([{
      amount: amount,
      payment_method: 'mpesa',
      reference_id: reference,
      status: 'pending'
    }]).select().single()

    if (paymentError) {
      console.error('Payment Insert Error:', paymentError)
    } else {
      await supabaseAdmin.from('registrations').update({ payment_id: paymentData.id }).eq('id', regData.id)
    }

    // 5. Trigger M-Pesa STK Push
    let stkMessage = 'BIB #' + bib + ' assigned.'
    try {
      const stk = await MpesaService.initiateStkPush(phone, amount, reference)
      if (stk.ResponseCode === '0') {
        stkMessage += ' STK Push sent to your phone.'
        if (paymentData) {
          await supabaseAdmin.from('payments').update({ checkout_request_id: stk.CheckoutRequestID }).eq('id', paymentData.id)
        }
      }
    } catch (stkErr) {
      console.warn('STK Push fail:', stkErr)
    }

    return NextResponse.json({ 
      success: true, 
      message: stkMessage,
      reference: reference,
      bib_number: bib,
      reg_id: regData.id
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Registration route error:', err)
    return NextResponse.json({ success: false, message: err.message || 'System error' }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  }
}
