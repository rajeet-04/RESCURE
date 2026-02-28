import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const patchAnimalSchema = z.object({
  name: z.string().optional(),
  status: z.enum(['IN_TREATMENT', 'STABLE', 'READY_FOR_ADOPTION', 'ADOPTED', 'RELEASED', 'DECEASED']).optional(),
  breed: z.string().optional(),
  estimatedAge: z.string().optional(),
  gender: z.string().optional(),
  color: z.string().optional(),
  photos: z.array(z.string()).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const animal = await prisma.animal.findUnique({
      where: { id },
      include: {
        healthRecords: { orderBy: { date: 'desc' } },
        expenses: { orderBy: { date: 'desc' } },
        sponsorships: { where: { active: true } },
        consultations: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!animal) {
      return NextResponse.json({ error: 'Animal not found' }, { status: 404 })
    }

    return NextResponse.json(animal)
  } catch (err) {
    console.error('[GET /api/animals/[id]]', err)
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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = patchAnimalSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const animal = await prisma.animal.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json(animal)
  } catch (err) {
    console.error('[PATCH /api/animals/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
