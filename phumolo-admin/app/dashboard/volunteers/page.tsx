'use client'

import { useEffect, useState } from 'react'
import { supabaseAdmin, Volunteer } from '@/lib/supabase'
import { format } from 'date-fns'



const CATEGORY_LABELS: Record<string, string> = {
  crowd_control: 'Crowd Control',
  registration: 'Registration Staff',
  water: 'Water Station',
  security: 'Security Team',
  medical: 'First Aiders',
  vip: 'VIP Relations',
  marshal: 'Race Marshal',
  group: 'Group',
}

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabaseAdmin.from('volunteers')
      .select('*')
      .order('submitted_at', { ascending: false })
      .then(({ data }) => {
        setVolunteers((data as Volunteer[]) || [])
        setLoading(false)
      })
  }, [])

  const filtered = volunteers.filter(v =>
    v.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.phone?.includes(search) ||
    v.email?.toLowerCase().includes(search.toLowerCase()) ||
    v.category?.toLowerCase().includes(search.toLowerCase())
  )

  const downloadCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Category', 'Organization', 'ID Number', 'Residence', 'Transport Needed', 'Accommodation Needed', 'Stipend Expected', 'Stipend Amount', 'Submitted At']
    const rows = filtered.map(v => [
      v.full_name, v.email, v.phone,
      CATEGORY_LABELS[v.category] || v.category,
      v.organization, v.id_number, v.residence,
      v.transport_assistance ? 'No' : 'Yes',
      v.accommodation_assistance ? 'No' : 'Yes',
      v.stipend_expectation ? 'Yes' : 'No',
      v.stipend_amount ?? '',
      format(new Date(v.submitted_at), 'dd MMM yyyy HH:mm')
    ])
    const csv = [headers, ...rows].map((r: (string | number | boolean | null)[]) => r.map(c => `"${c ?? ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'volunteers.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-[#C5A059] text-lg animate-pulse">Loading volunteers…</div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Volunteers</h1>
          <p className="text-zinc-400 text-sm mt-1">{volunteers.length} total signups</p>
        </div>
        <button
          onClick={downloadCSV}
          className="px-4 py-2 bg-[#C5A059] text-black text-sm font-bold rounded-xl hover:bg-[#d4b06a] transition"
        >
          Export CSV
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
          const count = volunteers.filter(v => v.category === key).length
          if (count === 0) return null
          return (
            <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-2xl font-black text-[#C5A059]">{count}</p>
              <p className="text-zinc-400 text-xs mt-1">{label}</p>
            </div>
          )
        })}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, phone, email or category…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#C5A059]"
      />

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3">Phone</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Organization</th>
                <th className="text-left px-5 py-3">Stipend</th>
                <th className="text-left px-5 py-3">Transport</th>
                <th className="text-left px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-zinc-800/50 transition">
                  <td className="px-5 py-3">
                    <p className="text-white font-medium">{v.full_name}</p>
                    <p className="text-zinc-500 text-xs">{v.email}</p>
                  </td>
                  <td className="px-5 py-3 text-zinc-300">{v.phone}</td>
                  <td className="px-5 py-3">
                    <span className="bg-[#C5A059]/10 text-[#C5A059] text-xs font-bold px-2.5 py-1 rounded-full border border-[#C5A059]/20">
                      {CATEGORY_LABELS[v.category] || v.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-300">{v.organization || '—'}</td>
                  <td className="px-5 py-3 text-zinc-300">
                    {v.stipend_expectation ? `KES ${v.stipend_amount ?? 'TBD'}` : 'None'}
                  </td>
                  <td className="px-5 py-3 text-zinc-300">{v.transport_assistance ? 'Needs transport' : 'Own transport'}</td>
                  <td className="px-5 py-3 text-zinc-500">{format(new Date(v.submitted_at), 'dd MMM yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center text-zinc-500 py-12">No volunteers found</div>
          )}
        </div>
      </div>
    </div>
  )
}
