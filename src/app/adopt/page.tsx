import { prisma } from '@/lib/prisma'
import AdoptClient from './_components/adopt-client'

export const metadata = { title: 'Adopt & Sponsor — RESCURE' }

export default async function AdoptPage() {
  const animals = await prisma.animal.findMany({
    where: { status: { in: ['READY_FOR_ADOPTION', 'STABLE', 'IN_TREATMENT'] } },
    include: {
      _count: { select: { sponsorships: true } },
      expenses: { select: { amount: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const serialised = animals.map((a) => ({
    ...a,
    intakeDate: a.intakeDate.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    expenses: a.expenses.map((e) => ({ amount: e.amount })),
  }))

  return <AdoptClient animals={serialised} />
}
