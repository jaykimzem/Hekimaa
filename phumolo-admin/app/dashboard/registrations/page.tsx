'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { Registration } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from 'next/link'

const PAGE_SIZE = 25

type SortField = keyof Registration
type SortDir = 'asc' | 'desc'

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [filterSize, setFilterSize] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortField, setSortField] = useState<SortField>('submitted_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data } = await supabaseAdmin.from('registrations').select('*').order('bib_number')
    setRegistrations((data as Registration[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filtered = useMemo(() => {
    let data = [...registrations]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(r =>
        `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.id_number?.toLowerCase().includes(q) ||
        String(r.bib_number).includes(q)
      )
    }
    if (filterCategory) data = data.filter(r => r.race_category === filterCategory)
    if (filterGender) data = data.filter(r => r.gender === filterGender)
    if (filterSize) data = data.filter(r => r.shirt_size === filterSize)
    if (filterStatus) data = data.filter(r => r.payment_status === filterStatus)
    data.sort((a, b) => {
      const av = a[sortField] ?? ''
      const bv = b[sortField] ?? ''
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
    return data
  }, [registrations, search, filterCategory, filterGender, filterSize, filterStatus, sortField, sortDir])

  const pages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleSort = (field: SortField) => {
    if (field === sortField) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
    setPage(0)
  }

  const exportCSV = () => {
    const headers = ['BIB', 'First Name', 'Last Name', 'Gender', 'Age', 'Email', 'Phone', 'ID Number', 'Category', 'Shirt Size', 'Shirt Color', 'Payment Status', 'Registered At']
    const rows = filtered.map(r => [
      r.bib_number, r.first_name, r.last_name, r.gender, r.age,
      r.email, r.phone, r.id_number, r.race_category,
      r.shirt_size, r.shirt_color, r.payment_status,
      format(new Date(r.submitted_at), 'yyyy-MM-dd HH:mm')
    ])
    const csv = [headers, ...rows].map(row => row.map(v => `"${v ?? ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `phumolo-registrations-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? <span className="ml-1 text-orange-500">{sortDir === 'asc' ? '↑' : '↓'}</span> : <span className="ml-1 text-zinc-600">↕</span>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Registrations</h1>
          <p className="text-zinc-400 text-sm mt-1">{filtered.length} of {registrations.length} runners</p>
        </div>
        <button
          onClick={exportCSV}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name, BIB, email, or ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
          <FilterSelect value={filterCategory} onChange={v => { setFilterCategory(v); setPage(0) }} options={['5KM', '10KM', '21KM', '42KM']} label="Category" />
          <FilterSelect value={filterGender} onChange={v => { setFilterGender(v); setPage(0) }} options={['Male', 'Female', 'Other']} label="Gender" />
          <FilterSelect value={filterSize} onChange={v => { setFilterSize(v); setPage(0) }} options={['XS', 'S', 'M', 'L', 'XL', 'XXL']} label="Shirt" />
          <FilterSelect value={filterStatus} onChange={v => { setFilterStatus(v); setPage(0) }} options={['Pending', 'Confirmed', 'Cancelled']} label="Status" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-800">
              <tr className="text-zinc-400 text-xs uppercase tracking-wider">
                <Th field="bib_number" label="BIB" onSort={handleSort}><SortIcon field="bib_number" /></Th>
                <Th field="first_name" label="Full Name" onSort={handleSort}><SortIcon field="first_name" /></Th>
                <Th field="gender" label="Gender" onSort={handleSort}><SortIcon field="gender" /></Th>
                <Th field="age" label="Age" onSort={handleSort}><SortIcon field="age" /></Th>
                <Th field="race_category" label="Category" onSort={handleSort}><SortIcon field="race_category" /></Th>
                <Th field="shirt_size" label="Shirt" onSort={handleSort}><SortIcon field="shirt_size" /></Th>
                <Th field="shirt_color" label="Color" onSort={handleSort}><SortIcon field="shirt_color" /></Th>
                <Th field="payment_status" label="Status" onSort={handleSort}><SortIcon field="payment_status" /></Th>
                <Th field="submitted_at" label="Date" onSort={handleSort}><SortIcon field="submitted_at" /></Th>
                <th className="px-4 py-3 text-left">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr><td colSpan={10} className="text-center text-zinc-500 py-16">Loading…</td></tr>
              ) : pageData.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-zinc-500 py-16">No registrations found</td></tr>
              ) : pageData.map(r => (
                <tr key={r.id} className="hover:bg-zinc-800/50 transition">
                  <td className="px-4 py-3 font-black text-orange-500">#{r.bib_number}</td>
                  <td className="px-4 py-3 text-white font-medium">{r.first_name} {r.last_name}</td>
                  <td className="px-4 py-3 text-zinc-300">{r.gender}</td>
                  <td className="px-4 py-3 text-zinc-300">{r.age}</td>
                  <td className="px-4 py-3">
                    <span className="bg-orange-500/10 text-orange-400 text-xs font-bold px-2 py-1 rounded-full">{r.race_category}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{r.shirt_size}</td>
                  <td className="px-4 py-3 text-zinc-300">{r.shirt_color}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.payment_status} /></td>
                  <td className="px-4 py-3 text-zinc-500">{format(new Date(r.submitted_at), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/registrations/${r.bib_number}`} className="text-orange-400 hover:text-orange-300 text-xs font-semibold">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-800">
            <p className="text-zinc-500 text-xs">Page {page + 1} of {pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 bg-zinc-800 text-white text-xs rounded-lg disabled:opacity-40 hover:bg-zinc-700 transition">← Prev</button>
              <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className="px-3 py-1.5 bg-zinc-800 text-white text-xs rounded-lg disabled:opacity-40 hover:bg-zinc-700 transition">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Th({ field, label, onSort, children }: { field: SortField; label: string; onSort: (f: SortField) => void; children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left cursor-pointer hover:text-white transition" onClick={() => onSort(field)}>
      {label}{children}
    </th>
  )
}

function FilterSelect({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
    >
      <option value="">All {label}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function StatusBadge({ status }: { status: string }) {
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
