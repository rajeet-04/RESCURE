import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface CityData {
  city: string
  totalCases: number
  resolvedCases: number
  activeNGOs: number
  averageResponseTime: number
}

export async function GET() {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || user.role !== 'PLATFORM_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ngos = await prisma.nGO.findMany({
    select: {
      id: true,
      city: true,
      rescueCases: {
        select: {
          id: true,
          state: true,
          createdAt: true,
          resolvedAt: true,
          report: { select: { createdAt: true } },
        },
      },
    },
  })

  // Group by city
  const cityMap = new Map<string, {
    ngoIds: Set<string>
    totalCases: number
    resolvedCases: number
    responseTimes: number[]
  }>()

  for (const ngo of ngos) {
    const city = ngo.city ?? 'Unknown'
    if (!cityMap.has(city)) {
      cityMap.set(city, { ngoIds: new Set(), totalCases: 0, resolvedCases: 0, responseTimes: [] })
    }
    const c = cityMap.get(city)!
    c.ngoIds.add(ngo.id)

    for (const rc of ngo.rescueCases) {
      c.totalCases++
      if (rc.resolvedAt) c.resolvedCases++

      // Response time: minutes from report created to case created
      if (rc.report?.createdAt) {
        const diffMs = rc.createdAt.getTime() - rc.report.createdAt.getTime()
        if (diffMs >= 0) c.responseTimes.push(diffMs / 60000)
      }
    }
  }

  const result: CityData[] = Array.from(cityMap.entries())
    .map(([city, data]) => ({
      city,
      totalCases: data.totalCases,
      resolvedCases: data.resolvedCases,
      activeNGOs: data.ngoIds.size,
      averageResponseTime:
        data.responseTimes.length > 0
          ? Math.round(
              data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length
            )
          : 0,
    }))
    .sort((a, b) => b.totalCases - a.totalCases)

  return NextResponse.json(result)
}
