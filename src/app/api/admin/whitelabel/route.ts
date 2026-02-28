import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getWhitelabelConfig, saveWhitelabelConfig } from '@/lib/whitelabel'

export async function GET() {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.role === 'PLATFORM_ADMIN') {
    const config = await getWhitelabelConfig()
    return NextResponse.json(config)
  }

  if (user.role === 'NGO_ADMIN') {
    const ngo = await prisma.nGO.findUnique({ where: { userId: user.id }, select: { tier: true } })
    if (ngo?.tier === 'ENTERPRISE') {
      const config = await getWhitelabelConfig()
      return NextResponse.json(config)
    }
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || user.role !== 'PLATFORM_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — PLATFORM_ADMIN only' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { appName, primaryColor, logo, tagline } = body as {
    appName?: string
    primaryColor?: string
    logo?: string
    tagline?: string
  }

  const saved = await saveWhitelabelConfig({ appName, primaryColor, logo, tagline })
  return NextResponse.json(saved)
}
