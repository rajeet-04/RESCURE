import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const SLA_MINUTES: Record<string, number> = {
  CRITICAL: 30,
  HIGH: 120,
  MEDIUM: 360,
  LOW: 1440,
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || (user.role !== 'NGO_ADMIN' && user.role !== 'NGO_WORKER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rescueCase = await prisma.rescueCase.findUnique({
    where: { id },
    include: {
      report: { select: { urgencyScore: true } },
    },
  })

  if (!rescueCase) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }

  const urgency = rescueCase.report.urgencyScore
  const slaMinutes = SLA_MINUTES[urgency] ?? 120

  let deadline = rescueCase.slaDeadline
  if (!deadline) {
    deadline = new Date(rescueCase.createdAt.getTime() + slaMinutes * 60 * 1000)
  }

  const now = Date.now()
  const remaining = Math.floor((deadline.getTime() - now) / 1000)
  const breached = remaining <= 0

  return NextResponse.json({
    deadline: deadline.toISOString(),
    remaining,
    breached,
    urgency,
    state: rescueCase.state,
  })
}
