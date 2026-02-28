import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AnimalStatus } from '@prisma/client'

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

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)
  const status = searchParams.get('status') as AnimalStatus | null

  const where = status ? { status } : {}

  const animals = await prisma.animal.findMany({
    where,
    orderBy: { intakeDate: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      species: true,
      breed: true,
      status: true,
      publicSlug: true,
      photos: true,
      intakeDate: true,
    },
  })

  const data = animals.map((a) => ({
    id: a.id,
    name: a.name,
    species: a.species,
    breed: a.breed,
    status: a.status,
    publicSlug: a.publicSlug,
    photo: a.photos[0] ?? null,
    intakeDate: a.intakeDate,
  }))

  return NextResponse.json({ data })
}
