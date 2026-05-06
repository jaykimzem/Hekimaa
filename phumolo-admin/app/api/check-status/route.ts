import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ref = searchParams.get('ref')

  if (!ref) {
    return NextResponse.json({ success: false, message: 'Missing reference.' }, { status: 400 })
  }

  try {
    // 1. Get payment status
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('id, status')
      .eq('reference_id', ref)
      .single() as { data: { id: string; status: string } | null; error: Error | null }

    if (paymentError || !payment) {
      return NextResponse.json({ success: false, message: 'Reference not found.' }, { status: 404 })
    }

    const response = {
      success: true,
      payment_status: payment.status,
      reg_status: null as string | null,
      bib_number: null as string | null
    }

    // 2. Try to get bib if it's a marathon reg
    const { data: reg, error: regError } = await supabaseAdmin
      .from('registrations')
      .select('status, bib_number')
      .eq('payment_id', payment.id)
      .single() as { data: { status: string; bib_number: string } | null; error: Error | null }

    if (reg && !regError) {
      response.reg_status = reg.status
      response.bib_number = reg.bib_number
    }

    return NextResponse.json(response)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, message: 'System error: ' + message }, { status: 500 })
  }
}