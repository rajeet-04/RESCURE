import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const addHealthRecordSchema = z.object({
  type: z.enum(['VACCINATION', 'TREATMENT', 'DIAGNOSIS', 'SURGERY', 'CHECKUP', 'NOTE']),
  title: z.string(),
  notes: z.string().optional(),
  documents: z.array(z.string()).optional(),
  date: z.string().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const records = await prisma.healthRecord.findMany({
      where: { animalId: params.id },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(records)
  } catch (err) {
    console.error('[GET /api/animals/[id]/health]', err)
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

    const body = await req.json()
    const parsed = addHealthRecordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { type, title, notes, documents, date } = parsed.data

    let vetId: string | undefined
    const role = (session.user as any).role
    if (role === 'VETERINARIAN') {
      const vet = await prisma.vet.findUnique({ where: { userId: (session.user as any).id } })
      if (vet) vetId = vet.id
    }

    const record = await prisma.healthRecord.create({
      data: {
        animalId: params.id,
        vetId,
        type,
        title,
        notes,
        documents: documents ?? [],
        date: date ? new Date(date) : new Date(),
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (err) {
    console.error('[POST /api/animals/[id]/health]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
