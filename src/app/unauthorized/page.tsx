import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '403 Unauthorized — RESCURE' }

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <span className="text-6xl">🚫</span>
        <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-8">
          You don&apos;t have permission to view this page. Please sign in with an authorised account.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="bg-white border-2 border-gray-200 text-gray-700 font-medium px-6 py-2.5 rounded-xl hover:border-orange-300 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/login"
            className="bg-orange-500 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-orange-600 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  )
}
