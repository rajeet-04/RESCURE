import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string(),
  auth: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = subscribeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint: parsed.data.endpoint },
      update: {
        p256dh: parsed.data.p256dh,
        auth: parsed.data.auth,
        userId: session.user.id,
      },
      create: {
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.p256dh,
        auth: parsed.data.auth,
        userId: session.user.id,
      },
    })

    return NextResponse.json(sub, { status: 201 })
  } catch (err) {
    console.error('[POST /api/push/subscribe]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { endpoint } = await req.json()
    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint required' }, { status: 400 })
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: session.user.id },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/push/subscribe]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
