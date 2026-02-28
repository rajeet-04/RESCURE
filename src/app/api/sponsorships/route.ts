import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id

  const body = await req.json().catch(() => null)
  if (!body || !body.animalId || body.planAmount == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { animalId, planAmount, planLabel } = body as {
    animalId: string
    planAmount: number
    planLabel?: string
  }

  const animal = await prisma.animal.findUnique({ where: { id: animalId }, select: { id: true } })
  if (!animal) {
    return NextResponse.json({ error: 'Animal not found' }, { status: 404 })
  }

  const sponsorship = await prisma.sponsorship.create({
    data: {
      sponsorId: userId,
      animalId,
      planAmount,
      active: true,
      isCorporate: false,
    },
  })

  return NextResponse.json(
    {
      sponsorship,
      planLabel: planLabel ?? null,
      message: 'Sponsorship activated (payment simulated)',
    },
    { status: 201 }
  )
}

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id

  const sponsorships = await prisma.sponsorship.findMany({
    where: { sponsorId: userId },
    include: {
      animal: {
        select: {
          id: true,
          name: true,
          species: true,
          status: true,
          photos: true,
        },
      },
    },
    orderBy: { startedAt: 'desc' },
  })

  return NextResponse.json({ sponsorships })
}
