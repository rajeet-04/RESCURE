import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UrgencyLevel } from '@prisma/client'

export async function GET() {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || user.role !== 'NGO_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ngo = await prisma.nGO.findFirst({
    where: { userId: user.id },
    select: { id: true },
  })

  if (!ngo) {
    return NextResponse.json({ error: 'NGO not found' }, { status: 404 })
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Last 6 months boundaries
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
      select: {
        resolvedAt: true,
        createdAt: true,
        workerId: true,
        worker: { select: { user: { select: { name: true } } } },
        report: { select: { urgencyScore: true } },
      },
    }),
    prisma.fieldWorker.findMany({
      where: { ngoId: ngo.id },
      select: {
        id: true,
        user: { select: { name: true } },
        _count: { select: { rescueCases: true } },
      },
      orderBy: { rescueCases: { _count: 'desc' } },
      take: 5,
    }),
  ])

  // Average resolution time in hours
  let avgResolutionHours = 0
  if (resolvedCases.length > 0) {
    const totalMs = resolvedCases.reduce((sum, c) => {
      const ms = (c.resolvedAt as Date).getTime() - c.createdAt.getTime()
      return sum + ms
    }, 0)
    avgResolutionHours = Math.round(totalMs / resolvedCases.length / 3600000)
  }

  // Cases by urgency
  const urgencyLevels = Object.values(UrgencyLevel)
  const urgencyCounts = await Promise.all(
    urgencyLevels.map(async (level) => {
      const count = await prisma.rescueCase.count({
        where: {
          ngoId: ngo.id,
          report: { urgencyScore: level },
        },
      })
      return { level, count }
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

  // Top field workers
  const topWorkers = fieldWorkers.map((w) => ({
    name: w.user.name ?? 'Unknown',
    casesResolved: w._count.rescueCases,
  }))

  return NextResponse.json({
    totalCases: allCases,
    casesThisMonth,
    avgResolutionHours,
    urgencyBreakdown: urgencyCounts,
    monthlyTrend,
    topWorkers,
  })
}
