import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
// v1.0.1 - Force redeploy

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Phumolo Marathon — Admin Portal',
  description: 'Admin dashboard for Phumolo Marathon registrations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
