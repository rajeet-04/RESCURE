import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ReportStatus } from '@prisma/client'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    const user = session?.user as { id: string; role: string } | undefined
    if (!user || user.role !== 'NGO_WORKER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rescueCase = await prisma.rescueCase.findUnique({
      where: { id },
      include: {
        report: true,
        animal: {
          select: { id: true, name: true, species: true, photos: true },
        },
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!rescueCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    return NextResponse.json(rescueCase)
  } catch (err) {
    console.error('[GET /api/worker/cases/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const body = (await req.json()) as { state: ReportStatus; note?: string }
    const { state, note } = body

    const existingCase = await prisma.rescueCase.findUnique({
      where: { id },
    })
    if (!existingCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }
    if (existingCase.workerId !== fieldWorker.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updatedCase = await prisma.rescueCase.update({
      where: { id },
      data: { state },
      include: {
        report: true,
        animal: { select: { id: true, name: true, species: true } },
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    })

    await prisma.caseTimeline.create({
      data: {
        caseId: id,
        state,
        actorId: user.id,
        note: note ?? null,
      },
    })

    if (state === 'EN_ROUTE') {
      await prisma.fieldWorker.update({
        where: { id: fieldWorker.id },
        data: { available: false },
      })
    } else if (state === 'RESCUED') {
      await prisma.fieldWorker.update({
        where: { id: fieldWorker.id },
        data: { available: true },
      })
    }

    return NextResponse.json(updatedCase)
  } catch (err) {
    console.error('[PATCH /api/worker/cases/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
