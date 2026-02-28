import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const addMessageSchema = z.object({
  content: z.string(),
  attachments: z.array(z.string()).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        animal: true,
        ngo: true,
      },
    })

    if (!consultation) {
      return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
    }

    return NextResponse.json(consultation)
  } catch (err) {
    console.error('[GET /api/consultations/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const role = (session.user as any).role

    const body = await req.json()
    const parsed = addMessageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { content, attachments } = parsed.data

    const message = await prisma.consultationMessage.create({
      data: {
        consultationId: params.id,
        senderId: userId,
        content,
        attachments: attachments ?? [],
      },
    })

    // If vet is posting and consultation is still OPEN, assign vet and move to IN_PROGRESS
    if (role === 'VETERINARIAN') {
      const consultation = await prisma.consultation.findUnique({
        where: { id: params.id },
        select: { status: true, vetId: true },
      })

      if (consultation?.status === 'OPEN') {
        const vet = await prisma.vet.findUnique({ where: { userId } })
        if (vet) {
          await prisma.consultation.update({
            where: { id: params.id },
            data: { status: 'IN_PROGRESS', vetId: vet.id },
          })
        }
      }
    }

    return NextResponse.json(message, { status: 201 })
  } catch (err) {
    console.error('[POST /api/consultations/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
