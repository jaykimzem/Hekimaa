'use client'

import { useEffect, useState } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { format } from 'date-fns'

type KaruraReg = {
  id: string
  names: string
  phone: string
  email: string
  company: string
  emergency_contact: string
  payment_status: string
  submitted_at: string
}

type Sponsorship = {
  id: string
  names: string
  phone: string
  reg_no: string
  institution: string
  program: string
  emergency_contact: string
  status: string
  submitted_at: string
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
    Approved: 'bg-green-500/10 text-green-400 border-green-500/20',
    Rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    Failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  )
}

export default function KaruraPage() {
  const [registrations, setRegistrations] = useState<KaruraReg[]>([])
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'runners' | 'sponsorships'>('runners')

  useEffect(() => {
    Promise.all([
      (supabaseAdmin.from('karura_registrations') as any).select('*').order('submitted_at', { ascending: false }),
      (supabaseAdmin.from('sponsorship_requests') as any).select('*').order('submitted_at', { ascending: false }),
    ]).then(([{ data: regs }, { data: sponsors }]) => {
      setRegistrations(regs || [])
      setSponsorships(sponsors || [])
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-[#C5A059] text-lg animate-pulse">Loading Karura data…</div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Karura Youth Run</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {registrations.length} runner registrations · {sponsorships.length} sponsorship requests
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-3">
        <button
          onClick={() => setTab('runners')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition ${tab === 'runners' ? 'bg-[#C5A059] text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
        >
          Runner Registrations ({registrations.length})
        </button>
        <button
          onClick={() => setTab('sponsorships')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition ${tab === 'sponsorships' ? 'bg-[#C5A059] text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
        >
          Sponsorship Requests ({sponsorships.length})
        </button>
      </div>

      {tab === 'runners' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Phone</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Company</th>
                  <th className="text-left px-5 py-3">Payment</th>
                  <th className="text-left px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {registrations.map(r => (
                  <tr key={r.id} className="hover:bg-zinc-800/50 transition">
                    <td className="px-5 py-3 text-white font-medium">{r.names}</td>
                    <td className="px-5 py-3 text-zinc-300">{r.phone}</td>
                    <td className="px-5 py-3 text-zinc-300">{r.email || '—'}</td>
                    <td className="px-5 py-3 text-zinc-300">{r.company || '—'}</td>
                    <td className="px-5 py-3"><StatusBadge status={r.payment_status} /></td>
                    <td className="px-5 py-3 text-zinc-500">{format(new Date(r.submitted_at), 'dd MMM yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {registrations.length === 0 && (
              <div className="text-center text-zinc-500 py-12">No Karura registrations yet</div>
            )}
          </div>
        </div>
      )}

      {tab === 'sponsorships' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Phone</th>
                  <th className="text-left px-5 py-3">Reg No</th>
                  <th className="text-left px-5 py-3">Institution</th>
                  <th className="text-left px-5 py-3">Program</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {sponsorships.map(s => (
                  <tr key={s.id} className="hover:bg-zinc-800/50 transition">
                    <td className="px-5 py-3 text-white font-medium">{s.names}</td>
                    <td className="px-5 py-3 text-zinc-300">{s.phone}</td>
                    <td className="px-5 py-3 text-zinc-300">{s.reg_no}</td>
                    <td className="px-5 py-3 text-zinc-300">{s.institution}</td>
                    <td className="px-5 py-3 text-zinc-300">{s.program}</td>
                    <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-5 py-3 text-zinc-500">{format(new Date(s.submitted_at), 'dd MMM yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sponsorships.length === 0 && (
              <div className="text-center text-zinc-500 py-12">No sponsorship requests yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
