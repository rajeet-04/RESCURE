import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const handoffSchema = z.object({
  targetNgoId: z.string(),
  reason: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as { id: string; role: string }).role
    if (role !== 'NGO_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = handoffSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { targetNgoId, reason } = parsed.data

    const animal = await prisma.animal.findUnique({
      where: { id: params.id },
      select: { caseId: true },
    })

    if (!animal?.caseId) {
      return NextResponse.json({ error: 'Animal or case not found' }, { status: 404 })
    }

    const [updatedCase] = await prisma.$transaction([
      prisma.rescueCase.update({
        where: { id: animal.caseId },
        data: { ngoId: targetNgoId },
      }),
      prisma.caseTimeline.create({
        data: {
          state: 'ASSIGNED',
          caseId: animal.caseId,
          note: reason
            ? `Handed off to ${targetNgoId}: ${reason}`
            : `Handed off to ${targetNgoId}`,
          actorId: (session.user as { id: string }).id,
        },
      }),
    ])

    return NextResponse.json(updatedCase)
  } catch (err) {
    console.error('[POST /api/animals/[id]/handoff]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
