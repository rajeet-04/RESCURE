import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/ngo/team/cases — returns active cases without a worker assigned
export async function GET() {
  try {
    const session = await auth()
    const user = session?.user as { id: string; role: string } | undefined
    if (!user || (user.role !== 'NGO_ADMIN' && user.role !== 'NGO_WORKER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ngo = await prisma.nGO.findUnique({ where: { userId: user.id } })
    if (!ngo) {
      return NextResponse.json({ error: 'NGO not found' }, { status: 404 })
    }

    const cases = await prisma.rescueCase.findMany({
      where: {
        ngoId: ngo.id,
        workerId: null,
        state: { notIn: ['RELEASED', 'CLOSED'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        report: {
          select: {
            address: true,
            description: true,
            urgencyScore: true,
            animalType: true,
            photos: true,
          },
        },
      },
    })

    return NextResponse.json(cases)
  } catch (err) {
    console.error('[GET /api/ngo/team/cases]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
