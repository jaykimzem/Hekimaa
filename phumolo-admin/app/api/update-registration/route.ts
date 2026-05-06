import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const data = Object.fromEntries(formData.entries())

    if (!data.phone || !data.first_name || !data.last_name) {
      return NextResponse.json({ success: false, message: 'Required profile fields are missing.' }, { status: 400 })
    }

    // 1. Update user details
    const { data: user, error: userError } = await (supabaseAdmin
      .from('users') as any)
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || null,
        date_of_birth: data.date_of_birth || null,
        gender: data.gender || null,
        id_number: data.id_number || null
      })
      .eq('phone', data.phone)
      .select('id')
      .single()

    if (userError) throw userError

    // 2. Update latest registration
    if (user) {
      const { data: reg, error: regSearchError } = await (supabaseAdmin
        .from('registrations') as any)
        .select('id')
        .eq('user_id', user.id)
        .order('id', { ascending: false })
        .limit(1)
        .single()

      if (reg && !regSearchError) {
        await (supabaseAdmin
          .from('registrations') as any)
          .update({ tshirt_size: data.tshirt_size || 'M' })
          .eq('id', reg.id)
      }
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Update failed: ' + error.message }, { status: 500 })
  }
}
