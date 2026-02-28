import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const user = session?.user as { id: string; role: string } | undefined
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notification = await prisma.notification.update({
      where: { id: params.id },
      data: { read: true, readAt: new Date() },
    })

    return NextResponse.json(notification)
  } catch (err) {
    console.error('[PATCH /api/notifications/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
