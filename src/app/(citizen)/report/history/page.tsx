import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'My Reports — RESCURE' }

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  EN_ROUTE: 'bg-indigo-100 text-indigo-800',
  RESCUED: 'bg-green-100 text-green-800',
  IN_CARE: 'bg-teal-100 text-teal-800',
  RELEASED: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-gray-100 text-gray-700',
  DUPLICATE: 'bg-red-100 text-red-800',
}

const URGENCY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-green-100 text-green-800',
}

export default async function ReportHistoryPage() {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/report/history')

  const userId = (session.user as { id?: string }).id ?? ''

  const reports = await prisma.incidentReport.findMany({
    where: { citizenId: userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      description: true,
      status: true,
      urgencyScore: true,
      createdAt: true,
    },
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <Link href="/" className="text-sm text-orange-600 hover:underline mb-2 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900">My Reports</h1>
          <p className="text-gray-500 mt-1 text-sm">Animals you&apos;ve reported on RESCURE</p>
        </div>

        {reports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">🐾</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">You haven&apos;t reported any animals yet</h2>
            <p className="text-gray-400 text-sm mb-6">
              Spotted an injured stray? Report it in under 60 seconds.
            </p>
            <Link
              href="/report"
              className="bg-orange-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors"
            >
              🚨 Make a Report
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <Link
                key={r.id}
                href={`/report/${r.id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-orange-200 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {r.urgencyScore && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${URGENCY_COLORS[r.urgencyScore] ?? 'bg-gray-100 text-gray-700'}`}>
                          {r.urgencyScore}
                        </span>
                      )}
                      {r.status && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {r.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {r.description ?? 'No description provided.'}
                    </p>
                  </div>
                  <div className="shrink-0 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
