import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const data = Object.fromEntries(formData.entries()) as Record<string, string>

    // 1. Insert volunteer record
    const { error: volunteerError } = await supabaseAdmin.from('volunteers').insert([{
      full_name: data.fullname || data.group_name || 'Unnamed',
      email: data.email || data.leader_email || '',
      phone: data.phone || data.leader_phone || '',
      category: data.category || 'group',
      organization: data.organization || data.group_name || '',
      id_number: data.id_number || '',
      residence: data.residence || '',
      transport_assistance: data.transport === 'yes',
      accommodation_assistance: data.accommodation === 'yes',
      stipend_expectation: data.stipend_expectation === 'yes',
      stipend_amount: data.stipend_amount ? parseFloat(data.stipend_amount as string) : null
    }])

    if (volunteerError) throw volunteerError

    // 2. Log activity
    await supabaseAdmin.from('activity_logs').insert([{
      event_type: 'volunteer_signup',
      description: `New volunteer signup: ${data.fullname || data.group_name}`
    }])

    return NextResponse.json({ success: true, message: 'Your volunteer application has been submitted successfully!' })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Volunteer submission error:', err)
    return NextResponse.json({ success: false, message: 'System error: ' + err.message }, { status: 500 })
  }
}
