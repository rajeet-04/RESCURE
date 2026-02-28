import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)
    const offset = parseInt(searchParams.get('offset') ?? '0', 10)

    const cases = await prisma.rescueCase.findMany({
      where: {
        state: { in: ['RESCUED', 'IN_CARE', 'RELEASED'] },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        state: true,
        createdAt: true,
        report: {
          select: {
            lat: true,
            lng: true,
            photos: true,
            urgencyScore: true,
            description: true,
            address: true,
          },
        },
        ngo: {
          select: {
            name: true,
            logo: true,
            city: true,
          },
        },
        animal: {
          select: {
            name: true,
            species: true,
            photos: true,
            publicSlug: true,
          },
        },
      },
    })

    return NextResponse.json(cases)
  } catch (err) {
    console.error('[GET /api/community/feed]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
