import Link from 'next/link'
import type { Metadata } from 'next'
import { ShieldAlert } from 'lucide-react'

export const metadata: Metadata = { title: '403 Unauthorized — RESCURE' }

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient-soft"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/60 via-white/80 to-green-50/60"></div>
      
      <div className="relative text-center max-w-sm animate-scale-in">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-6">
          <ShieldAlert className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-8">
          You don&apos;t have permission to view this page. Please sign in with an authorised account.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="bg-white border-2 border-gray-200 text-gray-700 font-medium px-6 py-2.5 rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
          >
            Go Home
          </Link>
          <Link
            href="/login"
            className="bg-primary text-white font-medium px-6 py-2.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  )
}
