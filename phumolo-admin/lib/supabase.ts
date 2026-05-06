import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type User = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string
  date_of_birth: string | null
  gender: string | null
  id_number: string | null
  created_at?: string
}

export type Payment = {
  id: string
  user_id: string
  amount: number
  payment_method: 'mpesa' | 'card' | 'bank'
  transaction_id: string | null
  reference_id: string
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  checkout_request_id: string | null
  metadata: Record<string, unknown> | null
  created_at?: string
}

export type Registration = {
  id: string
  user_id?: string | null
  payment_id?: string | null
  bib_number: string | number | null
  first_name: string
  last_name: string
  email: string | null
  phone: string
  gender: string | null
  age: number | string | null
  id_number: string | null
  race_category: string
  shirt_size: string | null
  shirt_color: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  payment_status: 'Pending' | 'Confirmed' | 'Cancelled'
  status?: string | null
  submitted_at: string
}

export type Volunteer = {
  id: string
  full_name: string
  email: string
  phone: string
  category: string
  organization: string | null
  id_number: string | null
  residence: string | null
  transport_assistance: boolean
  accommodation_assistance: boolean
  stipend_expectation: boolean
  stipend_amount: number | null
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
  submitted_at: string
  created_at?: string
}

export type KaruraRegistration = {
  id: string
  names: string
  phone: string
  email: string | null
  company: string | null
  emergency_contact: string | null
  payment_status: string
  transaction_id?: string | null
  checkout_request_id?: string | null
  reference?: string | null
  submitted_at: string
}

export type SponsorshipRequest = {
  id: string
  names: string
  phone: string
  reg_no: string
  institution: string
  program: string
  emergency_contact: string | null
  status: string
  submitted_at: string
}

export type ActivityLog = {
  id: string
  user_id?: string | null
  event_type: string
  description: string
  metadata?: Record<string, unknown> | null
  ip_address?: string | null
  created_at: string
}

// Untyped singleton clients — avoids Supabase Insert/Update type conflicts
// while keeping our own types for UI components
let _supabase: ReturnType<typeof createClient> | null = null
let _supabaseAdmin: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!_supabase) _supabase = createClient(supabaseUrl, supabaseAnonKey)
  return _supabase
}

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  return _supabaseAdmin
}

// Convenience exports
export const supabase = getSupabase()
export const supabaseAdmin = getSupabaseAdmin()
