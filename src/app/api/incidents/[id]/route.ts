import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ReportStatus } from '@prisma/client'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const incident = await prisma.incidentReport.findUnique({
      where: { id: params.id },
      include: {
        rescueCase: {
          select: {
            id: true,
            state: true,
            resolvedAt: true,
            worker: { select: { id: true } },
            ngo: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    return NextResponse.json(incident)
  } catch (err) {
    console.error('[GET /api/incidents/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const patchSchema = z.object({
  status: z
    .enum(['PENDING', 'ASSIGNED', 'EN_ROUTE', 'RESCUED', 'IN_CARE', 'RELEASED', 'CLOSED', 'DUPLICATE'])
    .optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as { role?: string }).role
    if (role !== 'NGO_ADMIN' && role !== 'NGO_WORKER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const updated = await prisma.incidentReport.update({
      where: { id: params.id },
      data: { status: parsed.data.status as ReportStatus | undefined },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[PATCH /api/incidents/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
