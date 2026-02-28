import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city')
    const onCallOnly = searchParams.get('onCallOnly') === 'true'

    const vets = await prisma.vet.findMany({
      where: {
        verified: true,
        available: true,
        ...(city ? { city } : {}),
        ...(onCallOnly ? { onCallAvailable: true } : {}),
      },
      select: {
        id: true,
        userId: true,
        licenseNo: true,
        specialization: true,
        city: true,
        rating: true,
        totalConsultations: true,
        available: true,
        onCallAvailable: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(vets)
  } catch (err) {
    console.error('[GET /api/vets]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
