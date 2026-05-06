import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    // 2. Insert registration into Supabase
    const { data: regData, error: regError } = await supabaseAdmin.from('registrations').insert([{
      first_name: data.first_name || 'Runner',
      last_name: data.last_name || '',
      email: data.email || null,
      phone: data.phone as string,
      id_number: data.id_number || null,
      race_category: raceMap[data.race_category as string] || data.race_category as string,
      shirt_size: data.tshirt_size?.toString().toUpperCase() || null,
      payment_status: 'Pending'
    }]).select().single()

    if (regError) throw regError

    // 3. Log activity
    await supabaseAdmin.from('activity_logs').insert([{
      event_type: 'registration_initiated',
      description: `New registration started for ${data.first_name} ${data.last_name} (${data.phone})`
    }])

    // 4. Return success and reference (ID)
    // In a real scenario, you'd trigger the M-Pesa STK push here.
    return NextResponse.json({ 
      success: true, 
      message: 'Registration data saved. Please complete payment to get your BIB.',
      reference: regData?.id 
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Registration error:', err)
    return NextResponse.json({ success: false, message: 'System error: ' + err.message }, { status: 500 })
  }
}
