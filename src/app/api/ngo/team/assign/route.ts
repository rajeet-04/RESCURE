import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/ngo/team/assign — assign a rescue case to a field worker
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const user = session?.user as { id: string; role: string } | undefined
    if (!user || (user.role !== 'NGO_ADMIN' && user.role !== 'NGO_WORKER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caseId, workerId } = (await req.json()) as {
      caseId: string
      workerId: string
    }

    if (!caseId || !workerId) {
      return NextResponse.json({ error: 'caseId and workerId are required' }, { status: 400 })
    }

    // Verify this case belongs to the admin's NGO
    const ngo = await prisma.nGO.findUnique({ where: { userId: user.id } })
    if (!ngo) {
      return NextResponse.json({ error: 'NGO not found' }, { status: 404 })
    }

    const rescueCase = await prisma.rescueCase.findUnique({ where: { id: caseId } })
    if (!rescueCase || rescueCase.ngoId !== ngo.id) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Verify this worker belongs to the same NGO
    const worker = await prisma.fieldWorker.findUnique({ where: { id: workerId } })
    if (!worker || worker.ngoId !== ngo.id) {
      return NextResponse.json({ error: 'Worker not found in this NGO' }, { status: 404 })
    }

    const [updated] = await prisma.$transaction([
      prisma.rescueCase.update({
        where: { id: caseId },
        data: { workerId, state: 'EN_ROUTE' },
      }),
      prisma.caseTimeline.create({
        data: {
          caseId,
          state: 'EN_ROUTE',
          note: `Assigned to field worker`,
          actorId: user.id,
        },
      }),
      prisma.fieldWorker.update({
        where: { id: workerId },
        data: { available: false },
      }),
    ])

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[POST /api/ngo/team/assign]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
