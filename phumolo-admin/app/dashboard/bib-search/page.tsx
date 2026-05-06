'use client'

import { useState } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { Registration } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from 'next/link'



export default function BibSearchPage() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<Registration | null | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setResult(undefined)

    const { data } = await supabaseAdmin
      .from('registrations')
      .select('*')
      .eq('bib_number', parseInt(query.trim()))
      .single()

    setResult((data as Registration | null) || null)
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white">BIB Number Search</h1>
        <p className="text-zinc-400 text-sm mt-1">Look up any runner by their BIB number</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex gap-3">
          <input
            type="number"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Enter BIB number e.g. 42"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-orange-500 text-center text-xl font-bold"
          />
          <button
            onClick={search}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition"
          >
            {loading ? '…' : '🔍'}
          </button>
        </div>
      </div>

      {result === null && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <p className="text-5xl mb-4">🤷</p>
          <p className="text-white font-bold">No runner found for BIB #{query}</p>
          <p className="text-zinc-500 text-sm mt-1">Double-check the number and try again</p>
        </div>
      )}

      {result && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* BIB header */}
          <div className="bg-orange-500 px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">BIB Number</p>
              <p className="text-white text-5xl font-black leading-none">#{result.bib_number}</p>
            </div>
            <span className={`text-sm font-semibold px-4 py-2 rounded-full border bg-black/20 text-white border-white/20`}>
              {result.payment_status}
            </span>
          </div>

          {/* Details */}
          <div className="p-6 grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Runner</p>
              <p className="text-white text-2xl font-black">{result.first_name} {result.last_name}</p>
            </div>
            <Detail label="Race Category" value={result.race_category} />
            <Detail label="Gender" value={result.gender} />
            <Detail label="Phone" value={result.phone} />
            <Detail label="Shirt Size" value={`${result.shirt_size} — ${result.shirt_color}`} />
            <Detail label="Emergency Contact" value={`${result.emergency_contact_name} (${result.emergency_contact_phone})`} />
            <Detail label="Registered" value={format(new Date(result.submitted_at), 'MMM d, yyyy h:mm a')} />
          </div>

          <div className="px-6 pb-6">
            <Link
              href={`/dashboard/registrations/${result.bib_number}`}
              className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition"
            >
              View Full Profile →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="text-white font-semibold text-sm">{value || '—'}</p>
    </div>
  )
}
