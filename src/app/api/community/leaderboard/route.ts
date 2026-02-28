import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type ReporterGroup = {
  citizenId: string | null
  _count: { citizenId: number }
}

type NGOGroup = {
  ngoId: string
  _count: { ngoId: number }
}

export async function GET() {
  try {
    const rawReporterGroups = await prisma.incidentReport.groupBy({
      by: ['citizenId'],
      where: { citizenId: { not: null } },
      _count: { citizenId: true },
      orderBy: { _count: { citizenId: 'desc' } },
      take: 10,
    })
    const reporterGroups = rawReporterGroups as ReporterGroup[]

    const rawNgoGroups = await prisma.rescueCase.groupBy({
      by: ['ngoId'],
      _count: { ngoId: true },
      where: { state: { in: ['RESCUED', 'RELEASED'] } },
      orderBy: { _count: { ngoId: 'desc' } },
      take: 10,
    })
    const ngoGroups = rawNgoGroups as NGOGroup[]

    const userIds = reporterGroups
      .map((g) => g.citizenId)
      .filter(Boolean) as string[]

    const ngoIds = ngoGroups.map((g) => g.ngoId)

    const [users, ngos] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, image: true },
      }),
      prisma.nGO.findMany({
        where: { id: { in: ngoIds } },
        select: { id: true, name: true, logo: true },
      }),
    ])

    const userMap = new Map(users.map((u) => [u.id, u]))
    const ngoMap = new Map(ngos.map((n) => [n.id, n]))

    const topReporters = reporterGroups
      .filter((g) => g.citizenId !== null)
      .map((g) => {
        const u = userMap.get(g.citizenId as string)
        return {
          userId: g.citizenId as string,
          name: u?.name ?? null,
          image: u?.image ?? null,
          count: g._count.citizenId,
        }
      })

    const topNGOs = ngoGroups.map((g) => {
      const n = ngoMap.get(g.ngoId)
      return {
        ngoId: g.ngoId,
        name: n?.name ?? 'Unknown NGO',
        logo: n?.logo ?? null,
        count: g._count.ngoId,
      }
    })

    return NextResponse.json({ topReporters, topNGOs })
  } catch (err) {
    console.error('[GET /api/community/leaderboard]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
