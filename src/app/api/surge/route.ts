import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendPushToRole } from '@/lib/push/server'
import { encodeGeohash } from '@/lib/geo/geohash'

export async function GET() {
  const events = await prisma.surgeEvent.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const result = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.reason ?? '',
    lat: e.lat,
    lng: e.lng,
    radius: e.radiusKm,
    createdAt: e.createdAt,
    volunteerCount: 0,
  }))

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || user.role !== 'PLATFORM_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as {
    title: string
    description: string
    lat: number
    lng: number
    radius: number
    message?: string
  }
  const { title, description, lat, lng, radius, message } = body

  if (!title || !description || lat === undefined || lng === undefined || radius === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const geohash = encodeGeohash(lat, lng, 5)

  // Create the SurgeEvent record (admin-created, not proactive)
  await prisma.surgeEvent.create({
    data: {
      geohash,
      lat,
      lng,
      radiusKm: radius,
      reason: description,
      title,
      isActive: true,
      isProactive: false,
    },
  })

  // Batch-create SURGE_ALERT notifications for all citizens
  const citizens = await prisma.user.findMany({
    where: { role: 'CITIZEN' },
    select: { id: true },
    take: 1000,
  })

  const batchSize = 100
  let created = 0
  for (let i = 0; i < citizens.length; i += batchSize) {
    const batch = citizens.slice(i, i + batchSize)
    const result = await prisma.notification.createMany({
      data: batch.map((c) => ({
        userId: c.id,
        type: 'SURGE_ALERT',
        title,
        body: message ?? description,
        payload: { lat, lng, radius },
      })),
    })
    created += result.count
  }

  // Push to all citizens
  await sendPushToRole('CITIZEN', {
    title,
    body: message ?? description,
    url: '/surge',
    tag: 'surge-alert',
  })

  return NextResponse.json({ created })
}
