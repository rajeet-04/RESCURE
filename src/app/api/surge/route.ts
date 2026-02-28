import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendPushToRole } from '@/lib/push/server'

export async function GET() {
  const events = await prisma.notification.findMany({
    where: { type: 'SURGE_EVENT' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const result = events.map((e) => {
    const payload = e.payload as { lat?: number; lng?: number; radius?: number; volunteerCount?: number } | null
    return {
      id: e.id,
      title: e.title,
      description: e.body,
      lat: payload?.lat ?? 0,
      lng: payload?.lng ?? 0,
      radius: payload?.radius ?? 5,
      createdAt: e.createdAt,
      volunteerCount: payload?.volunteerCount ?? 0,
    }
  })

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

  // Get all citizens (up to 1000)
  const citizens = await prisma.user.findMany({
    where: { role: 'CITIZEN' },
    select: { id: true },
    take: 1000,
  })

  // Batch create notifications for citizens
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

  // Store surge event record under admin userId
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'SURGE_EVENT',
      title,
      body: description,
      payload: { lat, lng, radius, volunteerCount: 0 },
    },
  })

  // Broadcast push notification to all citizens
  await sendPushToRole('CITIZEN', {
    title,
    body: message ?? description,
    url: '/surge',
    tag: 'surge-alert',
  })

  return NextResponse.json({ created })
}
