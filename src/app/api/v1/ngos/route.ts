import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function validateApiKey(req: NextRequest): boolean {
  const apiKey = process.env.RESCURE_API_KEY
  if (!apiKey) return true
  const auth = req.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) return false
  return auth.slice(7) === apiKey
}

export async function GET(req: NextRequest) {
  if (!validateApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ngos = await prisma.nGO.findMany({
    where: { verified: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      logo: true,
      activeCaseCount: true,
    },
  })

  return NextResponse.json({ data: ngos })
}
