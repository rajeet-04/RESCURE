import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  const user = session?.user as { id: string; name?: string } | undefined
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const monthParam = searchParams.get('month')

  // Default to previous month
  const now = new Date()
  let year: number
  let month: number

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number)
    year = y
    month = m - 1
  } else {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    year = prev.getFullYear()
    month = prev.getMonth()
  }

  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)

  const sponsorships = await prisma.sponsorship.findMany({
    where: { sponsorId: user.id, active: true },
    include: {
      animal: {
        include: {
          expenses: {
            where: { date: { gte: monthStart, lte: monthEnd } },
          },
          healthRecords: {
            where: { date: { gte: monthStart, lte: monthEnd } },
            orderBy: { date: 'asc' },
          },
        },
      },
    },
  })

  const animals = sponsorships.map((s) => {
    const a = s.animal
    const totalExpenses = a.expenses.reduce((sum, e) => sum + e.amount, 0)
    return {
      id: a.id,
      name: a.name ?? 'Unnamed Animal',
      species: a.species,
      photo: a.photos[0] ?? null,
      publicSlug: a.publicSlug,
      planAmount: s.planAmount,
      expenses: a.expenses.map((e) => ({
        category: e.category,
        amount: e.amount,
        note: e.note,
        date: e.date.toISOString(),
      })),
      totalExpenses,
      healthRecords: a.healthRecords.map((h) => ({
        type: h.type,
        title: h.title,
        notes: h.notes,
        date: h.date.toISOString(),
      })),
    }
  })

  const totalContributed = sponsorships.reduce((sum, s) => sum + s.planAmount / 100, 0)
  const monthName = monthStart.toLocaleString('default', { month: 'long', year: 'numeric' })

  return NextResponse.json({
    month: monthParam ?? `${year}-${String(month + 1).padStart(2, '0')}`,
    monthName,
    sponsorName: user.name ?? 'Sponsor',
    animals,
    totalContributed,
    impactSummary: {
      animalsSponsored: animals.length,
      healthUpdates: animals.reduce((sum, a) => sum + a.healthRecords.length, 0),
      totalExpensesCovered: animals.reduce((sum, a) => sum + a.totalExpenses, 0),
    },
  })
}
