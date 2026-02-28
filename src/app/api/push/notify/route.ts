import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { sendPushToUser } from '@/lib/push/server'

const notifySchema = z.object({
  userId: z.string().optional(),
  ngoId: z.string().optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  url: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = notifySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { userId, ngoId, title, body: notifBody, url } = parsed.data

    if (!userId && !ngoId) {
      return NextResponse.json({ error: 'userId or ngoId required' }, { status: 400 })
    }

    if (userId) {
      await sendPushToUser(userId, { title, body: notifBody, url })
    }
    // ngoId push handled separately if needed

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/push/notify]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
