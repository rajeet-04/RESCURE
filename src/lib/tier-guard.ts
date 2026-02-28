import { prisma } from '@/lib/prisma'

const TIER_LIMITS: Record<string, number> = { FREE: 10, PRO: 200, ENTERPRISE: Infinity }

export async function checkNGOCaseLimit(ngoId: string): Promise<{ allowed: boolean; tier: string; limit: number; current: number }> {
  const ngo = await prisma.nGO.findUnique({ where: { id: ngoId }, select: { tier: true, activeCaseCount: true } })
  if (!ngo) return { allowed: false, tier: 'FREE', limit: 10, current: 0 }
  const limit = TIER_LIMITS[ngo.tier] ?? 10
  return { allowed: ngo.activeCaseCount < limit, tier: ngo.tier, limit, current: ngo.activeCaseCount }
}
