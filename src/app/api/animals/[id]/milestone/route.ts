import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendPushToUser } from '@/lib/push/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || (user.role !== 'NGO_ADMIN' && user.role !== 'VETERINARIAN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as { milestone?: string } | null
  if (!body?.milestone) {
    return NextResponse.json({ error: 'milestone text required' }, { status: 400 })
  }

  const animal = await prisma.animal.findUnique({
    where: { id },
    select: { id: true, name: true },
  })
  if (!animal) {
    return NextResponse.json({ error: 'Animal not found' }, { status: 404 })
  }

  const sponsorships = await prisma.sponsorship.findMany({
    where: { animalId: id, active: true },
    select: { sponsorId: true },
  })

  const animalName = animal.name ?? 'Your sponsored animal'
  const title = `🐾 ${animalName} Milestone!`
  const notificationBody = body.milestone

  await Promise.all(
    sponsorships.map(async (s) => {
      await Promise.all([
        sendPushToUser(s.sponsorId, {
          title,
          body: notificationBody,
          url: `/sponsor/impact`,
          tag: `milestone-${id}`,
        }),
        prisma.notification.create({
          data: {
            userId: s.sponsorId,
            type: 'milestone',
            title,
            body: notificationBody,
            payload: { animalId: id },
          },
        }),
      ])
    })
  )

  return NextResponse.json({ notified: sponsorships.length })
}
