import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const user = session?.user as { id: string; role: string } | undefined
    if (!user || user.role !== 'NGO_WORKER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as { ngoId: string }
    const { ngoId } = body

    if (!ngoId) {
      return NextResponse.json({ error: 'ngoId is required' }, { status: 400 })
    }

    const existing = await prisma.fieldWorker.findUnique({
      where: { userId: user.id },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Field worker record already exists' },
        { status: 409 }
      )
    }

    const worker = await prisma.fieldWorker.create({
      data: {
        userId: user.id,
        ngoId,
        available: true,
      },
    })

    return NextResponse.json(worker, { status: 201 })
  } catch (err) {
    console.error('[POST /api/worker/onboard]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
