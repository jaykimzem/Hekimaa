'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const SESSION_KEY = 'phumolo_admin_session'

const navItems = [
  { href: '/dashboard',               label: 'Dashboard',     icon: '📊' },
  { href: '/dashboard/registrations', label: 'Registrations', icon: '📋' },
  { href: '/dashboard/volunteers',    label: 'Volunteers',    icon: '🙋' },
  { href: '/dashboard/karura',        label: 'Karura Run',    icon: '🌿' },
  { href: '/dashboard/bib-search',    label: 'BIB Search',    icon: '🔢' },
  { href: '/dashboard/settings',      label: 'Settings',      icon: '⚙️' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY)
    if (!session) {
      router.replace('/login')
    } else {
      setReady(true)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY)
    router.replace('/login')
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#C5A059]/30 border-t-[#C5A059] rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-black border-r border-zinc-800 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static`}
      >
        {/* Brand */}
        <div className="px-6 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Phumolo Marathon Logo"
              width={44}
              height={44}
              className="rounded-lg object-contain bg-white p-0.5"
            />
            <div>
              <p className="text-white font-black text-sm leading-tight">PHUMOLO</p>
              <p className="text-[#C5A059] text-xs font-bold tracking-[0.2em]">ADMIN PORTAL</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-[#C5A059] text-black shadow-lg shadow-[#C5A059]/20'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Admin info */}
        <div className="px-4 py-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900">
            <div className="w-8 h-8 rounded-full bg-[#C5A059] flex items-center justify-center text-black text-sm font-black">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold">admin</p>
              <p className="text-zinc-500 text-xs">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition py-1.5 rounded-lg hover:bg-red-500/5"
          >
            🚪 Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="bg-black border-b border-zinc-800 px-5 py-4 flex items-center justify-between lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white text-xl p-1"
            aria-label="Open menu"
          >
            ☰
          </button>
          <p className="text-[#C5A059] font-black text-sm tracking-widest">PHUMOLO</p>
          <button onClick={handleLogout} className="text-zinc-500 text-xs hover:text-red-400 transition">
            Logout
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
