import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ReportStatus } from '@prisma/client'

const statusSchema = z.object({
  status: z.enum(['ASSIGNED', 'EN_ROUTE', 'RESCUED', 'IN_CARE', 'RELEASED', 'CLOSED']),
  note: z.string().optional(),
  assignedWorkerId: z.string().nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as { role?: string }).role
    if (role !== 'NGO_ADMIN' && role !== 'NGO_WORKER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = statusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { status, note, assignedWorkerId } = parsed.data

    const rescueCase = await prisma.rescueCase.findUnique({
      where: { id },
      include: { report: { select: { citizenId: true } } },
    })

    if (!rescueCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const isTerminal = ['RESCUED', 'RELEASED', 'CLOSED'].includes(status)

    const [updatedCase] = await prisma.$transaction([
      prisma.rescueCase.update({
        where: { id },
        data: {
          state: status as ReportStatus,
          workerId: assignedWorkerId !== undefined ? assignedWorkerId : undefined,
          resolvedAt: isTerminal ? new Date() : undefined,
        },
      }),
      prisma.caseTimeline.create({
        data: {
          caseId: id,
          state: status as ReportStatus,
          note: note ?? null,
          actorId: session.user.id,
        },
      }),
    ])

    // Fire-and-forget push notification to reporter
    if (rescueCase.report.citizenId) {
      fetch(`${req.nextUrl.origin}/api/push/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: rescueCase.report.citizenId,
          title: 'Rescue Update',
          body: `Your report status is now: ${status.replace('_', ' ')}`,
          url: `/report/${rescueCase.reportId}`,
        }),
      }).catch(() => {})
    }

    return NextResponse.json(updatedCase)
  } catch (err) {
    console.error('[PATCH /api/cases/[id]/status]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
