import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const createAnimalSchema = z.object({
  caseId: z.string(),
  species: z.string(),
  breed: z.string().optional(),
  estimatedAge: z.string().optional(),
  gender: z.string().optional(),
  color: z.string().optional(),
  name: z.string().optional(),
  photos: z.array(z.string()).optional(),
})

function generateSlug(species: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `${species.toLowerCase()}-${suffix}`
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as { id: string; role: string }).role
    if (role !== 'NGO_ADMIN' && role !== 'NGO_WORKER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = createAnimalSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { caseId, species, breed, estimatedAge, gender, color, name, photos } = parsed.data

    const animal = await prisma.animal.create({
      data: {
        caseId,
        species,
        breed,
        estimatedAge,
        gender,
        color,
        name,
        photos: photos ?? [],
        qrCode: randomUUID(),
        publicSlug: generateSlug(species),
        status: 'IN_TREATMENT',
      },
    })

    return NextResponse.json(animal, { status: 201 })
  } catch (err) {
    console.error('[POST /api/animals]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

