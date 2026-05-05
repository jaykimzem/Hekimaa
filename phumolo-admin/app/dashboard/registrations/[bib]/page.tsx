'use client'

import { useEffect, useState, use } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { Registration } from '@/lib/supabase'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SHIRT_COLOR_MAP: Record<string, string> = {
  Red: '#ef4444', Blue: '#3b82f6', Black: '#18181b',
  White: '#f5f5f5', Green: '#22c55e', Orange: '#f97316',
  Yellow: '#eab308', Purple: '#a855f7', Pink: '#ec4899',
}

export default function RunnerProfile({ params }: { params: Promise<{ bib: string }> }) {
  const { bib } = use(params)
  const router = useRouter()
  const [runner, setRunner] = useState<Registration | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabaseAdmin
      .from('registrations')
      .select('*')
      .eq('bib_number', parseInt(bib))
      .single()
      .then(({ data }) => {
        const runnerData = data as Registration | null
        setRunner(runnerData)
        setStatus(runnerData?.payment_status || 'Pending')
        setLoading(false)
      })
  }, [bib])

  const updateStatus = async () => {
    if (!runner) return
    setSaving(true)
    await (supabaseAdmin.from('registrations') as any).update({ payment_status: status }).eq('id', runner.id)
    setRunner({ ...runner, payment_status: status as Registration['payment_status'] })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const printBib = () => window.print()

  if (loading) return <div className="text-orange-500 text-lg animate-pulse py-20 text-center">Loading runner profile…</div>
  if (!runner) return (
    <div className="text-center py-20">
      <p className="text-zinc-400 text-lg">Runner not found</p>
      <Link href="/dashboard/registrations" className="text-orange-500 mt-4 inline-block hover:underline">← Back to Registrations</Link>
    </div>
  )

  const colorHex = SHIRT_COLOR_MAP[runner.shirt_color] || '#888'
  const statusStyles: Record<string, string> = {
    Confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
    Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <>
      {/* Print-only BIB */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-bib, #print-bib * { visibility: visible !important; }
          #print-bib { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; }
        }
      `}</style>

      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/dashboard" className="hover:text-white transition">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/registrations" className="hover:text-white transition">Registrations</Link>
          <span>/</span>
          <span className="text-orange-500 font-bold">#{runner.bib_number}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — BIB Card */}
          <div className="lg:col-span-1 space-y-4">
            {/* BIB Badge */}
            <div id="print-bib">
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                {/* BIB Header */}
                <div className="bg-orange-500 px-6 py-4 text-center">
                  <p className="text-white text-xs font-black uppercase tracking-widest">Phumolo Marathon 2026</p>
                  <p className="text-white/80 text-xs">phumolomarathon.co.ke</p>
                </div>
                {/* BIB Number */}
                <div className="text-center py-6 px-4">
                  <p className="text-8xl font-black text-black leading-none">{runner.bib_number}</p>
                  <div className="mt-3 h-1 bg-orange-500 mx-8 rounded-full" />
                </div>
                {/* Runner info */}
                <div className="bg-black px-6 py-4 text-center">
                  <p className="text-white text-xl font-black uppercase">{runner.first_name} {runner.last_name}</p>
                  <p className="text-orange-400 text-sm font-bold mt-1">{runner.race_category}</p>
                </div>
              </div>
            </div>

            <button
              onClick={printBib}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2"
            >
              🖨️ Print BIB
            </button>

            {/* Update Status */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-3 text-sm">Update Payment Status</h3>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm mb-3 focus:outline-none focus:border-orange-500"
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <button
                onClick={updateStatus}
                disabled={saving}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition text-sm"
              >
                {saving ? 'Saving…' : saved ? '✅ Saved!' : 'Update Status'}
              </button>
            </div>
          </div>

          {/* Right — Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Status badge + header */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">BIB Number</p>
                  <p className="text-6xl font-black text-orange-500">#{runner.bib_number}</p>
                </div>
                <span className={`text-sm font-semibold px-4 py-2 rounded-full border ${statusStyles[runner.payment_status] || statusStyles.Pending}`}>
                  {runner.payment_status}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mt-4">{runner.first_name} {runner.last_name}</h2>
              <p className="text-zinc-400 text-sm">Registered {format(new Date(runner.submitted_at), 'EEEE, MMMM d, yyyy — h:mm a')}</p>
            </div>

            {/* Details Grid */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 grid grid-cols-2 gap-5">
              <Detail label="Gender" value={runner.gender} />
              <Detail label="Age" value={runner.age} />
              <Detail label="Email" value={runner.email} />
              <Detail label="Phone" value={runner.phone} />
              <Detail label="ID / Passport" value={runner.id_number} />
              <Detail label="Race Category" value={
                <span className="bg-orange-500/10 text-orange-400 text-sm font-bold px-3 py-1 rounded-full">{runner.race_category}</span>
              } />
              <Detail label="Shirt Size" value={runner.shirt_size} />
              <Detail label="Shirt Color" value={
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border border-white/20" style={{ background: colorHex }} />
                  <span>{runner.shirt_color}</span>
                </div>
              } />
              <Detail label="Emergency Contact" value={runner.emergency_contact_name} />
              <Detail label="Emergency Phone" value={runner.emergency_contact_phone} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => router.back()} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-xl transition text-sm">
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{label}</p>
      <div className="text-white font-semibold text-sm">{value || <span className="text-zinc-600">—</span>}</div>
    </div>
  )
}
