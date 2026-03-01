import { prisma } from '@/lib/prisma'
import { decodeGeohash } from '@/lib/geo/geohash'

// EONET bbox: minLon,maxLat,maxLon,minLat (NW corner then SE — non-standard format)
const INDIA_BBOX = '68.18,37.09,97.40,8.07'
const TTL_MS = 6 * 60 * 60 * 1000 // 6-hour expiry for live factors

// ─── Severity helpers ─────────────────────────────────────────────────────────

// WMO weather code → severity (returns 0 when no risk factor should be created)
function wmoSeverity(code: number): number {
  if (code >= 95) return 0.9   // thunderstorm with/without hail
  if (code >= 80) return 0.65  // rain showers moderate–violent
  if (code >= 65) return 0.55  // heavy continuous rain
  if (code >= 61) return 0.35  // slight–moderate rain
  if (code >= 51) return 0.18  // drizzle
  if (code === 45 || code === 48) return 0.12  // fog
  return 0
}

// River discharge vs percentile bands → flood severity
function floodSeverity(
  q: number | null,
  p25: number | null,
  p75: number | null,
): number {
  if (!q || !p25 || !p75 || q <= p25) return 0
  if (q <= p75) return 0.2
  return Math.min(0.3 + ((q - p75) / (p75 + 1)) * 0.5, 1.0)
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface OpenMeteoCurrentResponse {
  current?: {
    weathercode?: number
    precipitation?: number
    windspeed_10m?: number
  }
}

interface FloodDailyResponse {
  daily?: {
    river_discharge?: (number | null)[]
    river_discharge_p25?: (number | null)[]
    river_discharge_p75?: (number | null)[]
  }
}

interface EONETFeature {
  geometry?: { type: string; coordinates: number[] | number[][] }
  properties?: { categories?: Array<{ id: string }> }
}

interface OWMResponse {
  alerts?: Array<{ event: string; description: string }>
}

// Open-Meteo and GloFAS sometimes return bare `NaN` (invalid JSON) for
// locations with no river data or missing measurements. Replace before parsing.
async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text()
  return JSON.parse(text.replace(/:\s*NaN/gi, ': null'))
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function ingestLiveRiskFactors(): Promise<{ factorsCreated: number }> {
  // 1. Load all distinct coverage zone centroids
  const zones = await prisma.coverageZone.findMany({
    select: { geohash: true },
    distinct: ['geohash'],
  })

  const decoded = zones
    .map((z) => {
      const [minLat, minLng, maxLat, maxLng] = decodeGeohash(z.geohash)
      return {
        geohash: z.geohash,
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2,
      }
    })
    .filter((z) => isFinite(z.lat) && isFinite(z.lng))

  let factorsCreated = 0

  if (decoded.length === 0) return { factorsCreated }

  const lats = decoded.map((z) => z.lat.toFixed(4)).join(',')
  const lngs = decoded.map((z) => z.lng.toFixed(4)).join(',')

  // 2. Single batched call for weather + flood — comma-sep coords → 2 requests total
  const [weatherRaw, floodRaw] = await Promise.all([
    fetch(
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lats}&longitude=${lngs}` +
      `&current=weathercode,precipitation,windspeed_10m&forecast_days=1`,
      { cache: 'no-store' },
    ).then(safeJson),
    fetch(
      `https://flood-api.open-meteo.com/v1/flood` +
      `?latitude=${lats}&longitude=${lngs}` +
      `&daily=river_discharge,river_discharge_p25,river_discharge_p75&forecast_days=1`,
      { cache: 'no-store' },
    ).then(safeJson),
  ])

  // Normalise: single coord → object, multiple coords → array
  const weatherArr: OpenMeteoCurrentResponse[] = Array.isArray(weatherRaw)
    ? weatherRaw
    : [weatherRaw]
  const floodArr: FloodDailyResponse[] = Array.isArray(floodRaw) ? floodRaw : [floodRaw]

  // 3. Per-zone: wipe stale live factors, then create fresh ones
  const now = new Date()
  const expiresAt = new Date(Date.now() + TTL_MS)

  for (let i = 0; i < decoded.length; i++) {
    const { geohash } = decoded[i]

    // Delete non-manual live factors that haven't expired yet (prevents accumulation)
    await prisma.riskFactor.deleteMany({
      where: {
        geohash,
        source: { not: null }, // null source = manually created by admin
        expiresAt: { gt: now },
      },
    })

    // Weather / storm factor
    const code = weatherArr[i]?.current?.weathercode ?? 0
    const weatherSev = wmoSeverity(code)
    if (weatherSev > 0) {
      const category = code >= 80 ? ('STORM' as const) : ('WEATHER' as const)
      await prisma.riskFactor.create({
        data: { geohash, category, severity: weatherSev, source: 'open-meteo', expiresAt },
      })
      factorsCreated++
    }

    // Flood factor
    const q = floodArr[i]?.daily?.river_discharge?.[0] ?? null
    const p25 = floodArr[i]?.daily?.river_discharge_p25?.[0] ?? null
    const p75 = floodArr[i]?.daily?.river_discharge_p75?.[0] ?? null
    const floodSev = floodSeverity(q, p25, p75)
    if (floodSev > 0) {
      await prisma.riskFactor.create({
        data: {
          geohash,
          category: 'FLOOD' as const,
          severity: floodSev,
          source: 'open-meteo',
          expiresAt,
        },
      })
      factorsCreated++
    }
  }

  // 4. EONET — one call for all of India, non-critical (won't block on failure)
  try {
    const eonetRes = (await fetch(
      `https://eonet.gsfc.nasa.gov/api/v3/events/geojson` +
      `?status=open&days=7&bbox=${INDIA_BBOX}`,
      { cache: 'no-store' },
    ).then((r) => r.json())) as { features?: EONETFeature[] }

    const EONET_MAP: Record<string, 'STORM' | 'FLOOD' | 'WILDFIRE' | 'EARTHQUAKE' | 'WEATHER'> = {
      severeStorms: 'STORM',
      floods: 'FLOOD',
      wildfires: 'WILDFIRE',
      earthquakes: 'EARTHQUAKE',
      landslides: 'WEATHER',
    }

    for (const feature of eonetRes.features ?? []) {
      const coords = feature.geometry?.coordinates
      if (!coords) continue

      // Handle Point [lng,lat] and LineString [[lng,lat],...] — take first pair
      const pair = Array.isArray(coords[0]) ? (coords[0] as number[]) : (coords as number[])
      const [lng, lat] = pair

      const catId = feature.properties?.categories?.[0]?.id ?? ''
      const category = EONET_MAP[catId]
      if (!category || typeof lat !== 'number' || typeof lng !== 'number') continue

      // Find nearest coverage zone within ~165 km (1.5°)
      const gh5 = nearestZone(lat, lng, decoded)
      if (!gh5) continue

      await prisma.riskFactor.create({
        data: {
          geohash: gh5,
          category,
          severity: 0.7,
          source: 'eonet',
          expiresAt: new Date(Date.now() + TTL_MS),
        },
      })
      factorsCreated++
    }
  } catch {
    // EONET is non-critical — log but continue
    console.warn('[live-risk-ingestion] EONET fetch failed — skipping event data')
  }

  // 5. Optional OpenWeatherMap — only if key is configured
  const OWM_KEY = process.env.OPENWEATHER_API_KEY
  if (OWM_KEY) {
    for (const zone of decoded) {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/3.0/onecall` +
          `?lat=${zone.lat}&lon=${zone.lng}` +
          `&exclude=hourly,daily,minutely&units=metric&appid=${OWM_KEY}`,
          { cache: 'no-store' },
        ).then((r) => r.json()) as OWMResponse

        if ((res.alerts ?? []).length > 0) {
          await prisma.riskFactor.create({
            data: {
              geohash: zone.geohash,
              category: 'STORM' as const,
              severity: 0.75,
              source: 'owm',
              expiresAt: new Date(Date.now() + TTL_MS),
            },
          })
          factorsCreated++
        }
      } catch {
        // Per-zone OWM failure is non-fatal
      }
    }
  }

  return { factorsCreated }
}

// Find geohash of the decoded zone nearest to the event point (max 1.5° ≈ 165 km)
function nearestZone(
  lat: number,
  lng: number,
  zones: Array<{ geohash: string; lat: number; lng: number }>,
): string | null {
  let best: string | null = null
  let bestDist = Infinity
  for (const z of zones) {
    const d = Math.hypot(z.lat - lat, z.lng - lng)
    if (d < bestDist && d < 1.5) {
      bestDist = d
      best = z.geohash
    }
  }
  return best
}
