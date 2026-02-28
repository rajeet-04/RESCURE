import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({ onCallAvailable: z.boolean() })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

    const vet = await prisma.vet.update({
      where: { id },
      data: { onCallAvailable: parsed.data.onCallAvailable },
    })

    return NextResponse.json({ vet })
  } catch (err) {
    console.error('[PATCH /api/vets/[id]/oncall]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
