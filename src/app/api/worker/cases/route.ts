import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    const user = session?.user as { id: string; role: string } | undefined
    if (!user || user.role !== 'NGO_WORKER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fieldWorker = await prisma.fieldWorker.findUnique({
      where: { userId: user.id },
    })

    if (!fieldWorker) {
      return NextResponse.json({ error: 'Field worker not found' }, { status: 404 })
    }

    const cases = await prisma.rescueCase.findMany({
      where: {
        workerId: fieldWorker.id,
        state: { notIn: ['RELEASED', 'CLOSED'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        report: {
          select: {
            lat: true,
            lng: true,
            photos: true,
            urgencyScore: true,
            description: true,
            address: true,
          },
        },
        animal: {
          select: {
            id: true,
            name: true,
            species: true,
          },
        },
      },
    })

    return NextResponse.json(cases)
  } catch (err) {
    console.error('[GET /api/worker/cases]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
