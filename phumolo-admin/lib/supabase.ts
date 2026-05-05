import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton clients to avoid "multiple instances" warning
let _supabase: ReturnType<typeof createClient> | null = null
let _supabaseAdmin: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!_supabase) _supabase = createClient(supabaseUrl, supabaseAnonKey)
  return _supabase
}

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) _supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey)
  return _supabaseAdmin
}

// Convenience exports
export const supabase = getSupabase()
export const supabaseAdmin = getSupabaseAdmin()

export type Registration = {
  id: string
  bib_number: number
  first_name: string
  last_name: string
  email: string
  phone: string
  gender: 'Male' | 'Female' | 'Other'
  age: number
  id_number: string
  race_category: string
  shirt_size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
  shirt_color: string
  emergency_contact_name: string
  emergency_contact_phone: string
  payment_status: 'Pending' | 'Confirmed' | 'Cancelled'
  submitted_at: string
}
