import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UrgencyLevel } from '@prisma/client'

function validateApiKey(req: NextRequest): boolean {
  const apiKey = process.env.RESCURE_API_KEY
  if (!apiKey) return true // dev mode
  const auth = req.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) return false
  return auth.slice(7) === apiKey
}

export async function GET(req: NextRequest) {
  if (!validateApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)
  const urgency = searchParams.get('urgency') as UrgencyLevel | null

  const where = urgency ? { urgencyScore: urgency } : {}

  const [data, total] = await Promise.all([
    prisma.incidentReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        lat: true,
        lng: true,
        urgencyScore: true,
        status: true,
        createdAt: true,
        address: true,
      },
    }),
    prisma.incidentReport.count({ where }),
  ])

  const mapped = data.map((r) => ({
    id: r.id,
    lat: r.lat,
    lng: r.lng,
    urgencyLevel: r.urgencyScore,
    status: r.status,
    createdAt: r.createdAt,
    address: r.address,
  }))

  return NextResponse.json({ data: mapped, total, page: Math.floor(offset / limit) })
}
