import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ReportStatus } from '@prisma/client'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const incident = await prisma.incidentReport.findUnique({
      where: { id },
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

const statusPatchSchema = z.object({
  status: z
    .enum(['PENDING', 'ASSIGNED', 'EN_ROUTE', 'RESCUED', 'IN_CARE', 'RELEASED', 'CLOSED', 'DUPLICATE'])
    .optional(),
})

// Wizard fields — no auth required, only the fields added in Phase 2
const wizardPatchSchema = z.object({
  title: z.string().max(120).optional(),
  description: z.string().min(3).max(1000).optional(),
  animalType: z.string().max(50).optional(),
  reporterName: z.string().max(100).optional(),
  reporterPhone: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  landmark: z.string().max(200).optional(),
})

// Check if the body contains at least one wizard field (no status key)
function isWizardPatch(body: Record<string, unknown>): boolean {
  const wizardKeys = ['title', 'description', 'animalType', 'reporterName', 'reporterPhone', 'city', 'landmark']
  return wizardKeys.some((k) => k in body) && !('status' in body)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    // ── Wizard patch (no auth needed) ────────────────────────────────────────
    if (isWizardPatch(body)) {
      const parsed = wizardPatchSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
      }

      const updated = await prisma.incidentReport.update({
        where: { id },
        data: parsed.data,
      })

      return NextResponse.json(updated)
    }

    // ── Status patch (requires NGO role) ─────────────────────────────────────
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as { role?: string }).role
    if (role !== 'NGO_ADMIN' && role !== 'NGO_WORKER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const parsed = statusPatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const updated = await prisma.incidentReport.update({
      where: { id },
      data: { status: parsed.data.status as ReportStatus | undefined },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[PATCH /api/incidents/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
