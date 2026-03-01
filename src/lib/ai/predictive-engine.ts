import { prisma } from '@/lib/prisma'
import { decodeGeohash } from '@/lib/geo/geohash'
import { sendPushToRole } from '@/lib/push/server'

const BASE_RISK = 0.1
const SURGE_THRESHOLD = 0.6

async function getPlaceName(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'rescure-ai-engine' },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data?.address) {
      const addr = data.address
      const parts = []
      if (addr.neighbourhood || addr.neighborhood) parts.push(addr.neighbourhood || addr.neighborhood)
      if (addr.suburb) parts.push(addr.suburb)
      if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village)
      
      const place = Array.from(new Set(parts)).filter(Boolean).join(', ')
      if (place) return place
    }
    return null
  } catch (error) {
    return null
  }
}

/**
 * Calculates risk score for a geohash-5 zone.
 * Queries all non-expired RiskFactor rows for the geohash,
 * sums their severities + BASE_RISK.
 * If score > SURGE_THRESHOLD, calls triggerProactiveSurge.
 */
export async function calculateZoneRisk(
  geohash5: string
): Promise<{ riskScore: number; surgeTriggered: boolean }> {
  const factors = await prisma.riskFactor.findMany({
    where: { geohash: geohash5, expiresAt: { gt: new Date() } },
    select: { severity: true },
  })
  const riskScore = factors.reduce((sum, f) => sum + f.severity, BASE_RISK)

  if (riskScore > SURGE_THRESHOLD) {
    await triggerProactiveSurge(geohash5, riskScore)
    return { riskScore, surgeTriggered: true }
  }

  return { riskScore, surgeTriggered: false }
}

/**
 * Creates a proactive SurgeEvent in DB (isProactive: true).
 * Decodes geohash to lat/lng center.
 * Notifies NGO_WORKER role via push.
 * Guards against duplicate active proactive surges for the same geohash.
 */
export async function triggerProactiveSurge(
  geohash: string,
  score: number
): Promise<void> {
  // Guard: do not create duplicate active proactive surge for same zone
  const existing = await prisma.surgeEvent.findFirst({
    where: { geohash, isActive: true, isProactive: true },
  })
  if (existing) return

  const [minLat, minLng, maxLat, maxLng] = decodeGeohash(geohash)
  const lat = (minLat + maxLat) / 2
  const lng = (minLng + maxLng) / 2

  const placeName = await getPlaceName(lat, lng)

  const title = placeName
    ? `⚠️ Predictive Surge Risk — ${placeName} (${geohash})`
    : `⚠️ Predictive Surge Risk — Zone ${geohash}`
  const reason = `AI-detected risk score ${score.toFixed(2)} exceeds threshold (0.6). Pre-position field workers.`

  await prisma.surgeEvent.create({
    data: {
      geohash,
      lat,
      lng,
      title,
      reason,
      isActive: true,
      isProactive: true,
      riskScore: score,
    },
  })

  await sendPushToRole('NGO_WORKER', {
    title,
    body: reason,
    url: '/surge',
    tag: 'proactive-surge',
  })
}

/**
 * Queries all distinct CoverageZone geohashes and runs calculateZoneRisk on each.
 * Returns aggregate stats.
 */
export async function runPredictiveEngineForAllZones(): Promise<{
  zonesAnalyzed: number
  surgesTriggered: number
}> {
  const zones = await prisma.coverageZone.findMany({
    select: { geohash: true },
    distinct: ['geohash'],
  })

  let surgesTriggered = 0
  for (const zone of zones) {
    const result = await calculateZoneRisk(zone.geohash)
    if (result.surgeTriggered) surgesTriggered++
  }

  return { zonesAnalyzed: zones.length, surgesTriggered }
}
