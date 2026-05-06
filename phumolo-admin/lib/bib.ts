import { supabaseAdmin } from './supabase'

export async function generateBibNumber(raceCategory: string, gender: string): Promise<number> {
  let prefix = ''
  const g = gender.toLowerCase()
  const rc = raceCategory.toLowerCase()
  
  if (rc === '21k') {
    prefix = (g === 'female') ? '12' : '11'
  } else if (rc === '10k') {
    prefix = (g === 'female') ? '22' : '21'
  } else if (rc === 'corporate') {
    prefix = (g === 'female') ? '32' : '31'
  } else if (rc === 'community') {
    prefix = (g === 'female') ? '42' : '41'
  } else {
    prefix = '50'
  }

  const start = parseInt(prefix + '000')
  const end = parseInt(prefix + '999')

  const { data, error } = await (supabaseAdmin
    .from('registrations') as any)
    .select('bib_number')
    .gte('bib_number', start)
    .lte('bib_number', end)
    .order('bib_number', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) {
    return start + 1
  }

  return (data[0].bib_number as number) + 1
}
