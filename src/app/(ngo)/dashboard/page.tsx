import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Users, CheckCircle2, Layers } from 'lucide-react'

export default async function NGODashboardPage() {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role

  if (!session?.user || (role !== 'NGO_ADMIN' && role !== 'NGO_WORKER')) {
    redirect('/login')
  }

  const ngo = await prisma.nGO.findFirst({
    where: { userId: session.user.id },
    include: {
      _count: { select: { fieldWorkers: true, coverageZones: true } },
    },
  })

  if (!ngo) {
    redirect('/ngo/onboarding')
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [openCases, resolvedThisMonth, recentCases] = await Promise.all([
    prisma.rescueCase.count({
      where: { ngoId: ngo.id, state: { in: ['ASSIGNED', 'EN_ROUTE'] } },
    }),
    prisma.rescueCase.count({
      where: {
        ngoId: ngo.id,
        state: { in: ['RESCUED', 'IN_CARE', 'RELEASED', 'CLOSED'] },
        resolvedAt: { gte: startOfMonth },
      },
    }),
    prisma.rescueCase.findMany({
      where: { ngoId: ngo.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        report: { select: { description: true, urgencyScore: true, address: true } },
      },
    }),
  ])

  const urgencyColors: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-800',
    HIGH: 'bg-orange-100 text-orange-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-green-100 text-green-800',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {ngo.name}</h1>
        <p className="text-sm text-gray-500 mt-1">{ngo.city} · {ngo.verified ? '✅ Verified NGO' : 'Pending verification'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Open Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{openCases}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Resolved This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{resolvedThisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Team Size</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{ngo._count.fieldWorkers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Coverage Zones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{ngo._count.coverageZones}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-4">
          <Link
            href="/dashboard/cases"
            className="flex flex-col items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 p-4 text-center hover:bg-orange-100 transition-colors"
          >
            <Layers className="h-6 w-6 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">View Cases</span>
          </Link>
          <Link
            href="/dashboard/map"
            className="flex flex-col items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-center hover:bg-blue-100 transition-colors"
          >
            <MapPin className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Map View</span>
          </Link>
          <Link
            href="/dashboard/team"
            className="flex flex-col items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-center hover:bg-green-100 transition-colors"
          >
            <Users className="h-6 w-6 text-green-600" />
            <span className="text-sm font-medium text-green-700">Team</span>
          </Link>
        </div>
      </div>

      {/* Recent Cases */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Cases</h2>
        <div className="rounded-xl border bg-white divide-y">
          {recentCases.length === 0 && (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <CheckCircle2 className="h-8 w-8 mb-2" />
              <p className="text-sm">No cases yet</p>
            </div>
          )}
          {recentCases.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/cases/${c.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {c.report.description?.slice(0, 60) ?? 'Incident Report'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{c.report.address ?? 'No address'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={urgencyColors[c.report.urgencyScore]}>
                  {c.report.urgencyScore}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {c.state}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
