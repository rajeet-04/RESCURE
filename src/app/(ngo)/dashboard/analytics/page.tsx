import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UrgencyLevel } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import NGOAnalyticsCharts from './_components/ngo-analytics-charts'

export default async function NGOAnalyticsPage() {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || user.role !== 'NGO_ADMIN') redirect('/login')

  const ngo = await prisma.nGO.findFirst({
    where: { userId: user.id },
    select: { id: true, name: true },
  })
  if (!ngo) redirect('/ngo/onboarding')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
    }
  })

  const [allCases, casesThisMonth, resolvedCases, fieldWorkers] = await Promise.all([
    prisma.rescueCase.count({ where: { ngoId: ngo.id } }),
    prisma.rescueCase.count({ where: { ngoId: ngo.id, createdAt: { gte: startOfMonth } } }),
    prisma.rescueCase.findMany({
      where: {
        ngoId: ngo.id,
        state: { in: ['RELEASED', 'CLOSED'] },
        resolvedAt: { not: null },
      },
      select: { resolvedAt: true, createdAt: true },
    }),
    prisma.fieldWorker.findMany({
      where: { ngoId: ngo.id },
      select: {
        user: { select: { name: true } },
        _count: { select: { rescueCases: true } },
      },
      orderBy: { rescueCases: { _count: 'desc' } },
      take: 5,
    }),
  ])

  // Average resolution time
  let avgResolutionHours = 0
  if (resolvedCases.length > 0) {
    const totalMs = resolvedCases.reduce((sum, c) => {
      return sum + ((c.resolvedAt as Date).getTime() - c.createdAt.getTime())
    }, 0)
    avgResolutionHours = Math.round(totalMs / resolvedCases.length / 3600000)
  }

  // Urgency breakdown
  const urgencyLevels = Object.values(UrgencyLevel)
  const urgencyBreakdown = await Promise.all(
    urgencyLevels.map(async (level) => {
      const count = await prisma.rescueCase.count({
        where: { ngoId: ngo.id, report: { urgencyScore: level } },
      })
      return { level: level as string, count }
    })
  )

  // Monthly trend
  const monthlyTrend = await Promise.all(
    last6Months.map(async (m) => {
      const count = await prisma.rescueCase.count({
        where: { ngoId: ngo.id, createdAt: { gte: m.start, lte: m.end } },
      })
      return { month: m.label, count }
    })
  )

  // Top workers
  const topWorkers = fieldWorkers.map((w) => ({
    name: w.user.name ?? 'Unknown',
    casesResolved: w._count.rescueCases,
  }))

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">NGO Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">{ngo.name} · Performance Overview</p>
      </div>

      <Separator />

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{allCases}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Cases This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{casesThisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Avg Resolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {avgResolutionHours}
              <span className="text-sm font-normal text-muted-foreground ml-1">hrs</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardContent className="pt-6">
          <NGOAnalyticsCharts
            monthlyTrend={monthlyTrend}
            urgencyBreakdown={urgencyBreakdown}
            topWorkers={topWorkers}
          />
        </CardContent>
      </Card>
    </div>
  )
}
