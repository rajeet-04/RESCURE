import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decodeGeohash } from '@/lib/geo/geohash'

export async function GET() {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || (user.role !== 'PLATFORM_ADMIN' && user.role !== 'NGO_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const zones = await prisma.coverageZone.findMany({
    select: { geohash: true },
    distinct: ['geohash'],
  })

  const results = await Promise.all(
    zones.map(async (zone) => {
      const factors = await prisma.riskFactor.findMany({
        where: { geohash: zone.geohash, expiresAt: { gt: now } },
        select: { category: true, severity: true },
      })

      const riskScore = factors.reduce((sum, f) => sum + f.severity, 0.1)

      const [minLat, minLng, maxLat, maxLng] = decodeGeohash(zone.geohash)
      const lat = (minLat + maxLat) / 2
      const lng = (minLng + maxLng) / 2

      const activeSurgeCount = await prisma.surgeEvent.count({
        where: { geohash: zone.geohash, isActive: true },
      })

      return {
        geohash: zone.geohash,
        lat,
        lng,
        riskScore,
        hasActiveSurge: activeSurgeCount > 0,
        factors: factors.map((f) => ({ category: f.category, severity: f.severity })),
      }
    })
  )

  return NextResponse.json(results)
}
