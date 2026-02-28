import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendPushToUser } from '@/lib/push/server'

const createConsultationSchema = z.object({
  animalId: z.string(),
  question: z.string(),
  photos: z.array(z.string()).optional(),
  isEmergency: z.boolean().optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const role = (session.user as { id: string; role: string }).role

    if (role === 'NGO_ADMIN') {
      const ngo = await prisma.nGO.findUnique({ where: { userId } })
      if (!ngo) return NextResponse.json({ error: 'NGO not found' }, { status: 404 })

      const consultations = await prisma.consultation.findMany({
        where: { ngoId: ngo.id },
        include: { animal: true },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(consultations)
    }

    if (role === 'VETERINARIAN') {
      const vet = await prisma.vet.findUnique({ where: { userId } })
      if (!vet) return NextResponse.json({ error: 'Vet not found' }, { status: 404 })

      const consultations = await prisma.consultation.findMany({
        where: { vetId: vet.id },
        include: { animal: true },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(consultations)
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } catch (err) {
    console.error('[GET /api/consultations]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id

    const body = await req.json()
    const parsed = createConsultationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { animalId, question, photos, isEmergency } = parsed.data

    const ngo = await prisma.nGO.findUnique({ where: { userId } })
    if (!ngo) {
      return NextResponse.json({ error: 'NGO not found' }, { status: 404 })
    }

    const consultation = await prisma.consultation.create({
      data: {
        ngoId: ngo.id,
        animalId,
        question,
        photos: photos ?? [],
        isEmergency: isEmergency ?? false,
        status: 'OPEN',
      },
    })

    if (isEmergency) {
      const onCallVets = await prisma.vet.findMany({
        where: { onCallAvailable: true },
        select: { userId: true },
      })

      await Promise.allSettled(
        onCallVets.map((v) =>
          sendPushToUser(v.userId, {
            title: '🚨 Emergency Consultation',
            body: question.slice(0, 100),
            data: { consultationId: consultation.id },
          })
        )
      )
    }

    return NextResponse.json(consultation, { status: 201 })
  } catch (err) {
    console.error('[POST /api/consultations]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

