import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request) {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined

  if (!user || user.role !== 'NGO_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ngo = await prisma.nGO.findUnique({ where: { userId: user.id } })
  if (!ngo) {
    return NextResponse.json({ error: 'NGO not found' }, { status: 404 })
  }

  const body = await req.json()
  const { name, description, city, state, registrationNo } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Organisation name is required.' }, { status: 400 })
  }

  await prisma.nGO.update({
    where: { id: ngo.id },
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      registrationNo: registrationNo?.trim() || null,
    },
  })

  return NextResponse.json({ ok: true })
}
