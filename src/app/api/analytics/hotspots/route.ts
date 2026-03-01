import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const urgencyMap: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

export async function GET(request: NextRequest) {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || (user.role !== 'PLATFORM_ADMIN' && user.role !== 'NGO_ADMIN' && user.role !== 'NGO_WORKER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const days = Math.min(parseInt(searchParams.get('days') ?? '30', 10), 365)
  const since = new Date(Date.now() - days * 86400000)

  const reports = await prisma.incidentReport.findMany({
    where: { createdAt: { gte: since } },
    select: { lat: true, lng: true, urgencyScore: true, geohash: true },
  })

  // Group by first 5 chars of geohash
  const groups = new Map<string, { lats: number[]; lngs: number[]; urgencies: number[] }>()
  for (const r of reports) {
    const key = r.geohash.slice(0, 5)
    if (!groups.has(key)) groups.set(key, { lats: [], lngs: [], urgencies: [] })
    const g = groups.get(key)!
    g.lats.push(r.lat)
    g.lngs.push(r.lng)
    g.urgencies.push(urgencyMap[r.urgencyScore] ?? 2)
  }

  const hotspots = Array.from(groups.entries())
    .map(([geohash, g]) => ({
      geohash,
      lat: g.lats.reduce((a, b) => a + b, 0) / g.lats.length,
      lng: g.lngs.reduce((a, b) => a + b, 0) / g.lngs.length,
      count: g.lats.length,
      avgUrgency: g.urgencies.reduce((a, b) => a + b, 0) / g.urgencies.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50)

  return NextResponse.json(hotspots)
}
