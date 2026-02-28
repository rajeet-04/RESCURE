import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import HotspotMapLoader from '@/components/maps/hotspot-map-loader'
import RunAnalysisBtn from './_components/run-analysis-btn'
import { decodeGeohash } from '@/lib/geo/geohash'

interface Hotspot {
  geohash: string
  lat: number
  lng: number
  count: number
  avgUrgency: number
}

interface RiskZone {
  geohash: string
  lat: number
  lng: number
  riskScore: number
  hasActiveSurge: boolean
}

interface PageProps {
  searchParams: { days?: string }
}

const urgencyMap: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

async function getRiskZones(): Promise<RiskZone[]> {
  const zones = await prisma.coverageZone.findMany({
    distinct: ['geohash'],
    select: { geohash: true },
  })

  const results: RiskZone[] = []
  for (const zone of zones) {
    const gh5 = zone.geohash.slice(0, 5)
    const factors = await prisma.riskFactor.findMany({
      where: { geohash: gh5, expiresAt: { gt: new Date() } },
      select: { severity: true },
    })
    const riskScore = factors.reduce((sum, f) => sum + f.severity, 0.1)
    const activeSurge = await prisma.surgeEvent.count({
      where: { geohash: gh5, isActive: true },
    })
    const [minLat, minLng, maxLat, maxLng] = decodeGeohash(gh5)
    results.push({
      geohash: gh5,
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2,
      riskScore: Math.min(riskScore, 1),
      hasActiveSurge: activeSurge > 0,
    })
  }
  return results
}

async function getHotspots(days: number): Promise<Hotspot[]> {
  const since = new Date(Date.now() - days * 86400000)
  const reports = await prisma.incidentReport.findMany({
    where: { createdAt: { gte: since } },
    select: { lat: true, lng: true, urgencyScore: true, geohash: true },
  })

  const groups = new Map<string, { lats: number[]; lngs: number[]; urgencies: number[] }>()
  for (const r of reports) {
    const key = r.geohash.slice(0, 5)
    if (!groups.has(key)) groups.set(key, { lats: [], lngs: [], urgencies: [] })
    const g = groups.get(key)!
    g.lats.push(r.lat)
    g.lngs.push(r.lng)
    g.urgencies.push(urgencyMap[r.urgencyScore] ?? 2)
  }

  return Array.from(groups.entries())
    .map(([geohash, g]) => ({
      geohash,
      lat: g.lats.reduce((a, b) => a + b, 0) / g.lats.length,
      lng: g.lngs.reduce((a, b) => a + b, 0) / g.lngs.length,
      count: g.lats.length,
      avgUrgency: g.urgencies.reduce((a, b) => a + b, 0) / g.urgencies.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50)
}

function urgencyLabel(avg: number): string {
  if (avg >= 3.5) return 'Critical'
  if (avg >= 2.5) return 'High'
  if (avg >= 1.5) return 'Medium'
  return 'Low'
}

export default async function HotspotsPage({ searchParams }: PageProps) {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || (user.role !== 'PLATFORM_ADMIN' && user.role !== 'NGO_ADMIN')) {
    redirect('/unauthorized')
  }

  const days = parseInt(searchParams.days ?? '30', 10)
  const [hotspots, riskZones] = await Promise.all([getHotspots(days), getRiskZones()])
  const top10 = hotspots.slice(0, 10)

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient-soft"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-white/90 to-green-50/30"></div>
      
      <div className="relative p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <MapPin className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">Predictive Hotspot Map</h1>
            <RunAnalysisBtn userRole={user.role} />
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <Link
                key={d}
                href={`/hotspots?days=${d}`}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  days === d
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-primary/5 border border-green-100 hover:border-green-200'
                }`}
              >
                {d} days
              </Link>
            ))}
          </div>
        </div>

      {/* Map */}
      <div className="mb-8 h-[480px] overflow-hidden rounded-xl border shadow-sm">
        <HotspotMapLoader hotspots={hotspots} days={days} riskZones={riskZones} userRole={user.role} />
      </div>

      {/* Top 10 table */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold text-gray-800">Top 10 Hotspot Zones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Geohash Zone</th>
                <th className="px-4 py-2 font-medium">Incidents</th>
                <th className="px-4 py-2 font-medium">Avg Urgency</th>
                <th className="px-4 py-2 font-medium">Coordinates</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((h, i) => (
                <tr key={h.geohash} className="border-b last:border-0">
                  <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2 font-mono text-xs">{h.geohash}</td>
                  <td className="px-4 py-2 font-bold text-primary">{h.count}</td>
                  <td className="px-4 py-2">{urgencyLabel(h.avgUrgency)}</td>
                  <td className="px-4 py-2 text-gray-400 text-xs">
                    {h.lat.toFixed(4)}, {h.lng.toFixed(4)}
                  </td>
                </tr>
              ))}
              {top10.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No incident data in the last {days} days.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  )
}
