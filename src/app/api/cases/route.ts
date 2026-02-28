import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkNGOCaseLimit } from '@/lib/tier-guard'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const user = session?.user as { id: string; role: string } | undefined
    if (!user || (user.role !== 'NGO_ADMIN' && user.role !== 'NGO_WORKER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { reportId } = body as { reportId: string }
    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 })
    }

    const ngo = await prisma.nGO.findUnique({ where: { userId: user.id } })
    if (!ngo) {
      return NextResponse.json({ error: 'NGO not found' }, { status: 404 })
    }

    const tierCheck = await checkNGOCaseLimit(ngo.id)
    if (!tierCheck.allowed) {
      return NextResponse.json(
        { error: 'Case limit reached for FREE tier. Upgrade to Pro.' },
        { status: 403 }
      )
    }

    const rescueCase = await prisma.rescueCase.create({
      data: { reportId, ngoId: ngo.id, state: 'ASSIGNED' },
    })

    await Promise.all([
      prisma.nGO.update({ where: { id: ngo.id }, data: { activeCaseCount: { increment: 1 } } }),
      prisma.incidentReport.update({ where: { id: reportId }, data: { status: 'ASSIGNED' } }),
    ])

    return NextResponse.json(rescueCase, { status: 201 })
  } catch (err) {
    console.error('[POST /api/cases]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    const user = session?.user as { id: string; role: string } | undefined
    if (!user || (user.role !== 'NGO_ADMIN' && user.role !== 'NGO_WORKER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ngo = await prisma.nGO.findUnique({ where: { userId: user.id } })
    if (!ngo) {
      return NextResponse.json({ error: 'NGO not found' }, { status: 404 })
    }

    const cases = await prisma.rescueCase.findMany({
      where: { ngoId: ngo.id },
      orderBy: { createdAt: 'desc' },
      include: {
        report: {
          select: { lat: true, lng: true, urgencyScore: true, photos: true, address: true, description: true },
        },
      },
    })

    return NextResponse.json(cases)
  } catch (err) {
    console.error('[GET /api/cases]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
