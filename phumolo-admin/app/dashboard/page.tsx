'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { Registration } from '@/lib/supabase'
import { format, subDays, startOfDay, endOfDay, startOfWeek } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import Link from 'next/link'

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#fff7ed', '#ea580c']
const STATUS_COLORS: Record<string, string> = {
  Confirmed: '#22c55e',
  Pending: '#f59e0b',
  Cancelled: '#ef4444',
}

export default function DashboardPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const { data } = await supabaseAdmin
      .from('registrations')
      .select('*')
      .order('submitted_at', { ascending: false })
    setRegistrations((data as Registration[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-orange-500 text-lg animate-pulse">Loading analytics…</div>
      </div>
    )
  }

  const now = new Date()
  const todayStart = startOfDay(now)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })

  const total = registrations.length
  const todayCount = registrations.filter(r => new Date(r.submitted_at) >= todayStart).length
  const weekCount = registrations.filter(r => new Date(r.submitted_at) >= weekStart).length

  // Category breakdown
  const categories = ['5KM', '10KM', '21KM', '42KM']
  const categoryData = categories.map(cat => ({
    name: cat,
    count: registrations.filter(r => r.race_category === cat).length,
  }))

  // Payment status breakdown
  const statuses = ['Pending', 'Confirmed', 'Cancelled']
  const statusData = statuses.map(s => ({
    name: s,
    value: registrations.filter(r => r.payment_status === s).length,
  }))

  // Gender breakdown
  const maleCount = registrations.filter(r => r.gender === 'Male').length
  const femaleCount = registrations.filter(r => r.gender === 'Female').length
  const otherCount = registrations.filter(r => r.gender === 'Other').length

  // Last 14 days chart
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const day = subDays(now, 13 - i)
    const start = startOfDay(day)
    const end = endOfDay(day)
    return {
      date: format(day, 'MMM d'),
      count: registrations.filter(r => {
        const d = new Date(r.submitted_at)
        return d >= start && d <= end
      }).length,
    }
  })

  // Shirt size donut
  const shirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  const shirtData = shirtSizes.map(s => ({
    name: s,
    value: registrations.filter(r => r.shirt_size === s).length,
  })).filter(d => d.value > 0)

  const recent = registrations.slice(0, 10)

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Real-time overview of Phumolo Marathon registrations</p>
      </div>

      {/* Stat Cards Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Registrations" value={total} icon="🏅" accent="orange" />
        <StatCard label="This Week" value={weekCount} icon="📅" accent="blue" />
        <StatCard label="Today" value={todayCount} icon="⚡" accent="green" />
        <StatCard label="Confirmed Paid" value={registrations.filter(r => r.payment_status === 'Confirmed').length} icon="✅" accent="emerald" />
      </div>

      {/* Gender + Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-4">Gender Split</h3>
          <div className="space-y-3">
            <GenderBar label="Male" count={maleCount} total={total} color="#f97316" />
            <GenderBar label="Female" count={femaleCount} total={total} color="#fb7185" />
            <GenderBar label="Other" count={otherCount} total={total} color="#a78bfa" />
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-4">Payment Status</h3>
          <div className="space-y-3">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[s.name] }} />
                  <span className="text-zinc-300 text-sm">{s.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 bg-zinc-800 rounded-full w-32 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: total ? `${(s.value / total) * 100}%` : '0%',
                        background: STATUS_COLORS[s.name],
                      }}
                    />
                  </div>
                  <span className="text-white font-bold text-sm w-6 text-right">{s.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-white font-bold mb-4">Race Category Breakdown</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryData.map(c => (
            <div key={c.name} className="bg-zinc-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-orange-500">{c.count}</p>
              <p className="text-zinc-400 text-sm mt-1">{c.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart — last 14 days */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-4">Registrations — Last 14 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last14} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                labelStyle={{ color: '#fff', fontWeight: 700 }}
                itemStyle={{ color: '#f97316' }}
              />
              <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} name="Registrations" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — shirt size */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-4">Shirt Size Distribution</h3>
          {shirtData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={shirtData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {shirtData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend formatter={(val) => <span style={{ color: '#a1a1aa', fontSize: 12 }}>{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">No shirt data yet</div>
          )}
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Recent Registrations</h3>
          <Link href="/dashboard/registrations" className="text-orange-500 text-sm hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                <th className="text-left pb-3 pr-4">BIB</th>
                <th className="text-left pb-3 pr-4">Name</th>
                <th className="text-left pb-3 pr-4">Category</th>
                <th className="text-left pb-3 pr-4">Status</th>
                <th className="text-left pb-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {recent.map(r => (
                <tr key={r.id} className="hover:bg-zinc-800/50 transition">
                  <td className="py-3 pr-4">
                    <Link href={`/dashboard/registrations/${r.bib_number}`}>
                      <span className="font-black text-orange-500 hover:underline">#{r.bib_number}</span>
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-white font-medium">{r.first_name} {r.last_name}</td>
                  <td className="py-3 pr-4 text-zinc-300">{r.race_category}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={r.payment_status} />
                  </td>
                  <td className="py-3 text-zinc-500">{format(new Date(r.submitted_at), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recent.length === 0 && (
            <div className="text-center text-zinc-500 py-10">No registrations yet</div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: string; accent: string }) {
  const colors: Record<string, string> = {
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  }
  return (
    <div className={`rounded-2xl border p-5 ${colors[accent]}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-3xl font-black">{value.toLocaleString()}</p>
      <p className="text-sm opacity-70 mt-1">{label}</p>
    </div>
  )
}

function GenderBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-zinc-400 text-sm w-14">{label}</span>
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-white font-bold text-sm w-8 text-right">{count}</span>
      <span className="text-zinc-500 text-xs w-8">{pct}%</span>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
    Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  )
}
