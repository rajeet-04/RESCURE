import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const onboardVetSchema = z.object({
  licenseNo: z.string(),
  licenseDoc: z.string().optional(),
  specialization: z.string().optional(),
  city: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const body = await req.json()
    const parsed = onboardVetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { licenseNo, licenseDoc, specialization, city } = parsed.data

    const [vet] = await prisma.$transaction([
      prisma.vet.create({
        data: {
          userId,
          licenseNo,
          licenseDoc,
          specialization,
          city,
          verified: false,
          available: true,
          onCallAvailable: false,
          rating: 0,
          totalConsultations: 0,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { role: 'VETERINARIAN' },
      }),
    ])

    return NextResponse.json(vet, { status: 201 })
  } catch (err) {
    console.error('[POST /api/vets/onboard]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
