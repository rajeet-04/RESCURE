import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type BadgeDefinition = {
  id: string
  name: string
  description: string
  icon: string
  threshold: number
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: 'first-responder', name: 'First Responder', description: 'Submitted your first report', icon: '🆘', threshold: 1 },
  { id: 'community-guardian', name: 'Community Guardian', description: 'Reported 5 animals in need', icon: '🛡️', threshold: 5 },
  { id: 'animal-hero', name: 'Animal Hero', description: 'Reported 10 animals in need', icon: '🦸', threshold: 10 },
  { id: 'rescue-champion', name: 'Rescue Champion', description: 'Reported 25 animals in need', icon: '🏆', threshold: 25 },
  { id: 'legend', name: 'Legend', description: 'Reported 50 animals in need', icon: '⭐', threshold: 50 },
]

export async function GET() {
  try {
    const session = await auth()
    const user = session?.user as { id: string; role: string } | undefined

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const totalReports = await prisma.incidentReport.count({
      where: { citizenId: user.id },
    })

    const badges = BADGE_DEFINITIONS.map((def) => ({
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      threshold: def.threshold,
      earned: totalReports >= def.threshold,
      progress: Math.min(totalReports, def.threshold),
    }))

    return NextResponse.json({ badges, totalReports })
  } catch (err) {
    console.error('[GET /api/community/badges]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
