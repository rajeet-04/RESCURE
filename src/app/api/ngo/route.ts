import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const ngos = await prisma.nGO.findMany({
      where: { verified: true },
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(ngos)
  } catch (err) {
    console.error('[GET /api/ngo]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
