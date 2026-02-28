import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID_CATEGORIES = ['WEATHER', 'NOISE', 'CONSTRUCTION', 'CROWD'] as const
type ValidCategory = typeof VALID_CATEGORIES[number]

export async function GET() {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || (user.role !== 'PLATFORM_ADMIN' && user.role !== 'NGO_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const factors = await prisma.riskFactor.findMany({
    where: { expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(factors)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || user.role !== 'PLATFORM_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as {
    geohash?: string
    category?: string
    severity?: number
    expiresAt?: string
  }

  const { geohash, category, severity, expiresAt } = body

  if (!geohash || !category || severity === undefined || !expiresAt) {
    return NextResponse.json(
      { error: 'Missing required fields: geohash, category, severity, expiresAt' },
      { status: 400 }
    )
  }

  if (severity < 0 || severity > 1) {
    return NextResponse.json(
      { error: 'severity must be between 0.0 and 1.0' },
      { status: 400 }
    )
  }

  if (!VALID_CATEGORIES.includes(category as ValidCategory)) {
    return NextResponse.json(
      { error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` },
      { status: 400 }
    )
  }

  const factor = await prisma.riskFactor.create({
    data: {
      geohash,
      category: category as ValidCategory,
      severity,
      expiresAt: new Date(expiresAt),
    },
  })

  return NextResponse.json(factor, { status: 201 })
}
