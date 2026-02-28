import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const user = session?.user as { id: string; role: string } | undefined
    if (!user || user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { verified } = body as { verified: boolean }

    const ngo = await prisma.nGO.update({
      where: { id },
      data: { verified, verifiedAt: verified ? new Date() : null },
    })

    return NextResponse.json(ngo)
  } catch (err) {
    console.error('[PATCH /api/admin/ngos/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
