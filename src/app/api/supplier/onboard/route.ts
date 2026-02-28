import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id

  const body = await req.json().catch(() => null)
  if (!body || !body.name) {
    return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
  }

  const { name, description, city } = body as {
    name: string
    description?: string
    city?: string
  }

  // Check if already registered
  const existing = await prisma.supplier.findUnique({ where: { userId } })
  if (existing) {
    return NextResponse.json({ error: 'Supplier profile already exists' }, { status: 409 })
  }

  const [supplier] = await prisma.$transaction([
    prisma.supplier.create({
      data: {
        userId,
        name: name.trim(),
        description: description?.trim() ?? null,
        city: city?.trim() ?? null,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { role: 'SUPPLIER' },
    }),
  ])

  return NextResponse.json({ supplier }, { status: 201 })
}
