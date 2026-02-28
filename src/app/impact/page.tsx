import { prisma } from '@/lib/prisma'
import { BarChart3 } from 'lucide-react'
import StatCard from './_components/stat-card'
import ImpactCharts from './_components/impact-charts'

export const dynamic = 'force-dynamic'

/**
 * Render the RESCURE Impact Dashboard page component.
 *
 * Fetches aggregated incident reports, urgency and status counts, animal status counts,
 * recent reports (30-day window), and verified NGO totals, then renders a dashboard
 * with summary stats, a 30-day trend chart, urgency breakdown, animal status visuals,
 * and a status pipeline.
 *
 * @returns The dashboard page JSX element displaying aggregated incident and animal statistics, charts, and the status pipeline.
 */
export default async function ImpactPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalReports,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    pendingCount,
    assignedCount,
    enRouteCount,
    rescuedCount,
    inCareCount,
    releasedStatusCount,
    closedCount,
    inTreatmentCount,
    stableCount,
    readyForAdoptionCount,
    adoptedCount,
    animalReleasedCount,
    deceasedCount,
    recentReports,
    totalNGOs,
    totalAnimalsReleased,
    rescuedAnimals,
    inCareAnimals,
  ] = await Promise.all([
    prisma.incidentReport.count(),
    prisma.incidentReport.count({ where: { urgencyScore: 'CRITICAL' } }),
    prisma.incidentReport.count({ where: { urgencyScore: 'HIGH' } }),
    prisma.incidentReport.count({ where: { urgencyScore: 'MEDIUM' } }),
    prisma.incidentReport.count({ where: { urgencyScore: 'LOW' } }),
    prisma.incidentReport.count({ where: { status: 'PENDING' } }),
    prisma.incidentReport.count({ where: { status: 'ASSIGNED' } }),
    prisma.incidentReport.count({ where: { status: 'EN_ROUTE' } }),
    prisma.incidentReport.count({ where: { status: 'RESCUED' } }),
    prisma.incidentReport.count({ where: { status: 'IN_CARE' } }),
    prisma.incidentReport.count({ where: { status: 'RELEASED' } }),
    prisma.incidentReport.count({ where: { status: 'CLOSED' } }),
    prisma.animal.count({ where: { status: 'IN_TREATMENT' } }),
    prisma.animal.count({ where: { status: 'STABLE' } }),
    prisma.animal.count({ where: { status: 'READY_FOR_ADOPTION' } }),
    prisma.animal.count({ where: { status: 'ADOPTED' } }),
    prisma.animal.count({ where: { status: 'RELEASED' } }),
    prisma.animal.count({ where: { status: 'DECEASED' } }),
    prisma.incidentReport.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, urgencyScore: true, status: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.nGO.count({ where: { verified: true } }),
    prisma.animal.count({ where: { status: 'RELEASED' } }),
    prisma.animal.count({ where: { status: 'STABLE' } }),
    prisma.animal.count({ where: { status: 'IN_TREATMENT' } }),
  ])

  // Group recent reports by date for trend chart
  const trendMap: Record<string, number> = {}
  for (const r of recentReports) {
    const key = r.createdAt.toISOString().slice(0, 10)
    trendMap[key] = (trendMap[key] ?? 0) + 1
  }
  const trendData = Object.entries(trendMap).map(([date, count]) => ({ date, count }))

  const urgencyData = [
    { name: 'Critical', value: criticalCount, color: '#ef4444' },
    { name: 'High', value: highCount, color: '#f97316' },
    { name: 'Medium', value: mediumCount, color: '#eab308' },
    { name: 'Low', value: lowCount, color: '#22c55e' },
  ]

  const animalStatusData = [
    { name: 'In Treatment', value: inTreatmentCount },
    { name: 'Stable', value: stableCount },
    { name: 'Ready for Adoption', value: readyForAdoptionCount },
    { name: 'Adopted', value: adoptedCount },
    { name: 'Released', value: animalReleasedCount },
    { name: 'Deceased', value: deceasedCount },
  ]

  const totalAnimalsHelped = rescuedAnimals + inCareAnimals + totalAnimalsReleased

  const urgencyBreakdown = [
    { label: 'Critical', count: criticalCount, color: 'bg-red-500', total: totalReports },
    { label: 'High', count: highCount, color: 'bg-yellow-500', total: totalReports },
    { label: 'Medium', count: mediumCount, color: 'bg-blue-500', total: totalReports },
    { label: 'Low', count: lowCount, color: 'bg-green-500', total: totalReports },
  ]

  const pipeline = [
    { label: 'Pending', count: pendingCount },
    { label: 'Assigned', count: assignedCount },
    { label: 'En Route', count: enRouteCount },
    { label: 'Rescued', count: rescuedCount },
    { label: 'In Care', count: inCareCount },
    { label: 'Released', count: releasedStatusCount },
    { label: 'Closed', count: closedCount },
  ]

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient-soft opacity-40"></div>
      
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-primary via-green-600 to-green-700 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-3 mb-2 animate-fade-in">
            <BarChart3 className="w-8 h-8" />
            <h1 className="text-3xl font-bold">RESCURE Impact Dashboard</h1>
          </div>
          <p className="mb-8 text-green-100">Real-time data on animal rescue operations across cities.</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Reports" value={totalReports} icon="📋" />
            <StatCard label="Verified NGOs" value={totalNGOs} icon="🏥" />
            <StatCard label="Animals Helped" value={totalAnimalsHelped} icon="🐾" />
            <StatCard label="Animals Released" value={totalAnimalsReleased} icon="🕊️" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Charts */}
        <h2 className="mb-4 text-xl font-semibold text-gray-800">30-Day Trend & Animal Status</h2>
        <ImpactCharts trendData={trendData} urgencyData={urgencyData} animalStatusData={animalStatusData} />

        {/* Urgency Breakdown */}
        <div className="mt-10">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Urgency Breakdown</h2>
          <div className="space-y-3">
            {urgencyBreakdown.map(({ label, count, color, total }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-20 text-sm font-medium text-gray-600">{label}</span>
                <div className="flex-1 rounded-full bg-gray-100 h-5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-semibold text-gray-700">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Pipeline */}
        <div className="mt-10">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Status Pipeline</h2>
          <div className="flex flex-wrap gap-2 items-center">
            {pipeline.map(({ label, count }, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className="rounded-lg border bg-gray-50 px-4 py-3 text-center min-w-[90px]">
                  <p className="text-xl font-bold text-primary">{count}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
                {i < pipeline.length - 1 && (
                  <span className="text-gray-300 text-lg">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
