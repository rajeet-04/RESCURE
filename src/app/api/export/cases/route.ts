import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function escapeCsv(value: string | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(request: NextRequest) {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || (user.role !== 'PLATFORM_ADMIN' && user.role !== 'NGO_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') ?? '30', 10)
  const since = new Date(Date.now() - days * 86400000)

  // For NGO_ADMIN: only their cases; for PLATFORM_ADMIN: all cases
  let ngoId: string | undefined
  if (user.role === 'NGO_ADMIN') {
    const ngo = await prisma.nGO.findUnique({ where: { userId: user.id }, select: { id: true } })
    if (!ngo) return NextResponse.json({ error: 'NGO not found' }, { status: 404 })
    ngoId = ngo.id
  }

  const cases = await prisma.rescueCase.findMany({
    where: {
      ...(ngoId ? { ngoId } : {}),
      createdAt: { gte: since },
    },
    include: {
      report: { select: { address: true, urgencyScore: true } },
      ngo: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = ['Case ID', 'Status', 'Urgency', 'Location', 'Created At', 'Resolved At', 'NGO']
  const rows = cases.map((c) => [
    escapeCsv(c.id),
    escapeCsv(c.state),
    escapeCsv(c.report.urgencyScore),
    escapeCsv(c.report.address),
    escapeCsv(c.createdAt.toISOString()),
    escapeCsv(c.resolvedAt?.toISOString()),
    escapeCsv(c.ngo.name),
  ])

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="cases-export.csv"',
    },
  })
}
