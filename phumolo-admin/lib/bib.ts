import { supabaseAdmin } from './supabase'

export async function generateBibNumber(raceCategory: string, gender: string): Promise<number> {
  try {
    let prefix = ''
    const g = (gender || 'Other').toLowerCase()
    const rc = (raceCategory || '10k').toLowerCase()
    
    if (rc.includes('21')) {
      prefix = (g === 'female') ? '12' : '11'
    } else if (rc.includes('10')) {
      prefix = (g === 'female') ? '22' : '21'
    } else if (rc.includes('corp')) {
      prefix = (g === 'female') ? '32' : '31'
    } else if (rc.includes('comm')) {
      prefix = (g === 'female') ? '42' : '41'
    } else {
      prefix = '50'
    }

    const start = parseInt(prefix + '000')
    const end = parseInt(prefix + '999')

    const { data, error } = await supabaseAdmin
      .from('registrations')
      .select('bib_number')
      .gte('bib_number', start)
      .lte('bib_number', end)
      .order('bib_number', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching last BIB:', error)
      return start + 1
    }

    if (!data || data.length === 0) {
      return start + 1
    }

    const lastBib = data[0].bib_number as number
    if (lastBib >= end) {
      console.warn(`BIB range ${prefix}XXX is full!`)
      // Fallback or alert needed in real scenario
    }

    return lastBib + 1
  } catch (err) {
    console.error('generateBibNumber Exception:', err)
    return 9999 // High fallback number
  }
}
