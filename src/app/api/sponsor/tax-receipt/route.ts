import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function getPlanLabel(planAmount: number): string {
  const rupees = planAmount / 100
  if (rupees <= 299) return 'Basic'
  if (rupees <= 599) return 'Standard'
  return 'Premium'
}

function monthsBetween(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1
  )
}

export async function GET(request: NextRequest) {
  const session = await auth()
  const user = session?.user as { id: string; name?: string; email?: string } | undefined
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const yearStr = searchParams.get('year')
  const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear()

  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31, 23, 59, 59)
  const now = new Date()

  const sponsorships = await prisma.sponsorship.findMany({
    where: {
      sponsorId: user.id,
      startedAt: { lte: yearEnd },
      OR: [
        { cancelledAt: null },
        { cancelledAt: { gte: yearStart } },
      ],
    },
    include: {
      animal: { select: { name: true, species: true } },
    },
    orderBy: { startedAt: 'asc' },
  })

  const receipts = sponsorships.map((s, idx) => {
    const effectiveStart = s.startedAt < yearStart ? yearStart : s.startedAt
    const effectiveEnd = s.cancelledAt && s.cancelledAt < yearEnd ? s.cancelledAt : (yearEnd < now ? yearEnd : now)
    const months = Math.max(1, monthsBetween(effectiveStart, effectiveEnd))
    const amountPerMonth = s.planAmount / 100
    const totalAmount = months * amountPerMonth

    return {
      receiptNo: `RESCURE-${year}-${String(idx + 1).padStart(4, '0')}`,
      animalName: s.animal.name ?? 'Unnamed Animal',
      animalSpecies: s.animal.species,
      plan: getPlanLabel(s.planAmount),
      planAmount: amountPerMonth,
      monthsActive: months,
      totalAmount,
      startDate: s.startedAt.toISOString(),
    }
  })

  const grandTotal = receipts.reduce((sum, r) => sum + r.totalAmount, 0)

  return NextResponse.json({
    year,
    donorName: user.name ?? 'Donor',
    donorEmail: user.email ?? '',
    receipts,
    grandTotal,
  })
}
