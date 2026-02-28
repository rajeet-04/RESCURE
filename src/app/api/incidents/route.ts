import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const incidentSchema = z.object({
  description: z.string().min(3).max(1000),
  lat: z.number(),
  lng: z.number(),
  geohash: z.string().min(6),
  photos: z.array(z.string()).optional().default([]),
  address: z.string().optional(),
  citizenId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = incidentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const geohash6 = data.geohash.slice(0, 6)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

    const duplicate = await prisma.incidentReport.findFirst({
      where: {
        geohash: { startsWith: geohash6 },
        status: { in: ['PENDING', 'ASSIGNED'] },
        createdAt: { gte: twoHoursAgo },
      },
      select: { id: true },
    })

    if (duplicate) {
      return NextResponse.json(
        { error: 'Duplicate incident', existingId: duplicate.id },
        { status: 409 }
      )
    }

    const incident = await prisma.incidentReport.create({
      data: {
        description: data.description,
        lat: data.lat,
        lng: data.lng,
        geohash: data.geohash,
        photos: data.photos,
        address: data.address,
        citizenId: data.citizenId,
        status: 'PENDING',
        urgencyScore: 'MEDIUM',
      },
    })

    // Fire-and-forget urgency scoring
    const scoreUrl = new URL('/api/incidents/score', req.nextUrl.origin)
    fetch(scoreUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        incidentId: incident.id,
        imageUrl: data.photos[0] ?? null,
      }),
    }).catch(() => {})

    return NextResponse.json(incident, { status: 201 })
  } catch (err) {
    console.error('[POST /api/incidents]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
