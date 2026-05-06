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
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .update({
        first_name: data.first_name as string,
        last_name: data.last_name as string,
        email: (data.email as string) || null,
        date_of_birth: (data.date_of_birth as string) || null,
        gender: (data.gender as string) || null,
        id_number: (data.id_number as string) || null
      })
      .eq('phone', data.phone as string)
      .select('id')
      .single()

    if (userError) throw userError

    // 2. Update latest registration
    if (user) {
      const { data: reg, error: regSearchError } = await supabaseAdmin
        .from('registrations')
        .select('id')
        .eq('user_id', user.id)
        .order('id', { ascending: false })
        .limit(1)
        .single()

      if (reg && !regSearchError) {
        await supabaseAdmin
          .from('registrations')
          .update({ tshirt_size: (data.tshirt_size as string) || 'M' })
          .eq('id', reg.id)
      }
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully.' })
  } catch (error: unknown) {
    const err = error as Error
    return NextResponse.json({ success: false, message: 'Update failed: ' + err.message }, { status: 500 })
  }
}
