import { NextResponse } from 'next/server'
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

export async function GET() {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || (user.role !== 'PLATFORM_ADMIN' && user.role !== 'NGO_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let ngoId: string | undefined
  if (user.role === 'NGO_ADMIN') {
    const ngo = await prisma.nGO.findUnique({ where: { userId: user.id }, select: { id: true } })
    if (!ngo) return NextResponse.json({ error: 'NGO not found' }, { status: 404 })
    ngoId = ngo.id
  }

  const animals = await prisma.animal.findMany({
    where: ngoId
      ? { case: { ngoId } }
      : undefined,
    include: {
      case: { include: { ngo: { select: { name: true } } } },
    },
    orderBy: { intakeDate: 'desc' },
  })

  const headers = ['ID', 'Name', 'Species', 'Status', 'Intake Date', 'NGO']
  const rows = animals.map((a) => [
    escapeCsv(a.id),
    escapeCsv(a.name),
    escapeCsv(a.species),
    escapeCsv(a.status),
    escapeCsv(a.intakeDate.toISOString()),
    escapeCsv(a.case?.ngo?.name),
  ])

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="animals-export.csv"',
    },
  })
}
