import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const incidentSchema = z.object({
  description: z.string().min(3).max(1000).optional(),
  lat: z.number(),
  lng: z.number(),
  geohash: z.string().min(6),
  photos: z.array(z.string()).optional().default([]),
  address: z.string().optional(),
  // Wizard Step-2 fields (optional at creation, filled in during review)
  title: z.string().max(120).optional(),
  animalType: z.string().max(50).optional(),
  reporterName: z.string().max(100).optional(),
  reporterPhone: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  landmark: z.string().max(200).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = incidentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // Resolve the logged-in user server-side — never trust client-supplied IDs
    const session = await auth()
    const citizenId = (session?.user as { id?: string } | undefined)?.id ?? undefined

    const data = parsed.data
    const geohash7 = data.geohash.slice(0, 7)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000)

    // Only deduplicate the same user's own reports (or anonymous vs anonymous).
    // Different logged-in users at the same spot can each file a report independently.
    const duplicate = await prisma.incidentReport.findFirst({
      where: {
        geohash: { startsWith: geohash7 },
        status: { in: ['PENDING', 'ASSIGNED'] },
        createdAt: { gte: thirtyMinsAgo },
        citizenId: citizenId ?? null, // null matches anonymous; a real ID matches only that user
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
        description: data.description ?? '',
        lat: data.lat,
        lng: data.lng,
        geohash: data.geohash,
        photos: data.photos,
        address: data.address,
        citizenId,
        status: 'PENDING',
        urgencyScore: 'MEDIUM',
        title: data.title,
        animalType: data.animalType,
        reporterName: data.reporterName,
        reporterPhone: data.reporterPhone,
        city: data.city,
        landmark: data.landmark,
      },
    })

    const origin = req.nextUrl.origin
    const internalKey = process.env.INTERNAL_API_KEY ?? ''

    // Fire-and-forget: AI photo analysis (pre-populate wizard Step 2)
    if (incident.photos.length > 0) {
      fetch(`${origin}/api/incidents/${incident.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {})
    }

    // Fire-and-forget: legacy urgency scoring
    fetch(`${origin}/api/incidents/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        incidentId: incident.id,
        imageUrl: data.photos[0] ?? null,
      }),
    }).catch(() => {})

    // Fire-and-forget: NGO + external shelter outreach
    fetch(`${origin}/api/incidents/${incident.id}/notify-external`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': internalKey,
      },
    }).catch(() => {})

    return NextResponse.json(incident, { status: 201 })
  } catch (err) {
    console.error('[POST /api/incidents]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
