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

    const body = await req.json()
    const lat = parseFloat(body.lat)
    const lng = parseFloat(body.lng)

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'Invalid lat/lng' }, { status: 400 })
    }

    const updated = await prisma.fieldWorker.update({
      where: { userId: user.id },
      data: { lat, lng, lastSeenAt: new Date(), available: true },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[POST /api/field-worker/location]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    const user = session?.user as { id: string; role: string } | undefined
    if (!user || user.role !== 'NGO_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ngo = await prisma.nGO.findUnique({ where: { userId: user.id } })
    if (!ngo) {
      return NextResponse.json({ error: 'NGO not found' }, { status: 404 })
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const workers = await prisma.fieldWorker.findMany({
      where: { ngoId: ngo.id, lastSeenAt: { gte: fiveMinutesAgo } },
    })

    return NextResponse.json(workers)
  } catch (err) {
    console.error('[GET /api/field-worker/location]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
