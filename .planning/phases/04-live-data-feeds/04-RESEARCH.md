# Phase 4: Live Data Feeds for Hotspot Map — Research

**Researched:** 2026-03-01  
**Domain:** External API ingestion → RiskFactor table → hotspot map overlays  
**Confidence:** HIGH (primary sources verified via official docs)

---

## Summary

RESCURE's predictive engine already has the full data model (`RiskFactor`, `SurgeEvent`, `CoverageZone`) and risk-score calculation pipeline. What's missing is a **live data feed layer** — something that populates `RiskFactor` rows with real-world signals before `calculateZoneRisk` aggregates them. Currently, admins must POST risk factors manually; there is no automated ingestion.

This phase adds three things:

1. **Live API ingestion** — on every "Run Predictive Analysis" click, before scoring runs, the engine fetches weather (precipitation/storm severity) and flood (river discharge) data for every coverage zone centroid, plus scans NASA EONET for open natural-disaster events within the India bounding box, and upserts matching `RiskFactor` rows.
2. **NGO coordinates layer** — the hotspot map gets a 4th toggleable layer showing verified NGOs as green pins, sourced directly from the `NGO` table (already has `lat/lng`).
3. **Schema extension** — new `RiskCategory` enum values `FLOOD`, `EARTHQUAKE`, `WILDFIRE`, `STORM` to hold the new live-data-sourced factors with full fidelity. Existing WEATHER/NOISE/CONSTRUCTION/CROWD rows are unaffected.

**Primary recommendation:** Use **Open-Meteo** (weather + flood, 100% free, no API key) as the core live feed, augmented by **NASA EONET** (natural disasters, free, no key) for point-event overlays. GDACS and USGS are supplements, not primary sources.

---

## API Inventory

### Tier 1 — Zero Cost, No API Key, Production-Ready

#### 1. Open-Meteo Weather Forecast API
| Property | Value |
|----------|-------|
| Base URL | `https://api.open-meteo.com/v1/forecast` |
| Auth | None |
| Rate Limit | 10,000 calls/day (non-commercial) |
| Batch | Yes — comma-separated `latitude` and `longitude` params |
| India coverage | Full |
| Latency | ~100-300 ms per call |
| Confidence | HIGH — verified at open-meteo.com/en/docs |

**Key current-conditions params:**
```
current=precipitation,rain,weathercode,windspeed_10m,wind_gusts_10m
```

**WMO weather code → `RiskFactor.severity` mapping:**
```typescript
export function wmoCodeToSeverity(code: number): number {
  if (code >= 95) return 0.9   // thunderstorm with/without hail
  if (code >= 80) return 0.65  // rain showers (moderate–violent)
  if (code >= 65) return 0.55  // heavy continuous rain
  if (code >= 61) return 0.35  // slight–moderate rain
  if (code >= 51) return 0.18  // drizzle
  if (code === 45 || code === 48) return 0.12  // fog
  return 0.0                   // clear, no risk factor created
}
```

**Batch request example (multiple zones in one call):**
```typescript
// Source: https://open-meteo.com/en/docs
const lats = zones.map(z => z.lat).join(',')
const lngs = zones.map(z => z.lng).join(',')
const url = `https://api.open-meteo.com/v1/forecast` +
  `?latitude=${lats}&longitude=${lngs}` +
  `&current=precipitation,weathercode,windspeed_10m`

const data = await fetch(url).then(r => r.json())
// data is an array when multiple coords are supplied
```

---

#### 2. Open-Meteo Global Flood API (GloFAS v4)
| Property | Value |
|----------|-------|
| Base URL | `https://flood-api.open-meteo.com/v1/flood` |
| Auth | None |
| Rate Limit | Shared 10,000 calls/day with weather API |
| Resolution | 5 km (GloFAS v4) |
| Forecast horizon | Up to 7 months |
| India coverage | Full (Ganges, Brahmaputra, Godavari basins) |
| Confidence | HIGH — verified at open-meteo.com/en/docs/flood-api |

**Key params:**
```
daily=river_discharge,river_discharge_p25,river_discharge_p75
forecast_days=7
```

**River discharge → severity mapping (relative thresholds):**
```typescript
// GloFAS discharge is in m³/s — use percentile bands as proxy
// Source: GloFAS documentation + open-meteo flood API
export function floodDischargeToSeverity(
  discharge: number,
  p25: number,
  p75: number
): number {
  if (discharge <= p25) return 0.0         // below normal — no risk
  if (discharge <= p75) return 0.2         // normal range
  const ratio = (discharge - p75) / (p75 || 1)
  return Math.min(0.3 + ratio * 0.5, 1.0) // above 75th percentile → flood risk
}
```

**Full example:**
```typescript
// Source: https://open-meteo.com/en/docs/flood-api
const res = await fetch(
  `https://flood-api.open-meteo.com/v1/flood` +
  `?latitude=${lat}&longitude=${lng}` +
  `&daily=river_discharge,river_discharge_p25,river_discharge_p75` +
  `&forecast_days=3`
)
const { daily } = await res.json() as FloodResponse
const today = daily.river_discharge[0]
const p25 = daily.river_discharge_p25?.[0] ?? today * 0.7
const p75 = daily.river_discharge_p75?.[0] ?? today * 1.3
const severity = floodDischargeToSeverity(today, p25, p75)
```

---

#### 3. NASA EONET v3 (Natural Event Tracker)
| Property | Value |
|----------|-------|
| Base URL | `https://eonet.gsfc.nasa.gov/api/v3/events/geojson` |
| Auth | None |
| Rate Limit | Not documented; conservative use recommended |
| Categories | severeStorms, wildfires, floods, landslides, earthquakes |
| Bbox filter | `bbox=minLon,maxLat,maxLon,minLat` |
| Confidence | HIGH — verified at eonet.gsfc.nasa.gov/docs/v3 |

**India bounding box:** `bbox=68.18,37.09,97.40,8.07`

**EONET category → `RiskCategory` mapping:**
| EONET category ID | RESCURE RiskCategory |
|-------------------|----------------------|
| `severeStorms` | `STORM` |
| `floods` | `FLOOD` |
| `wildfires` | `WILDFIRE` |
| `landslides` | `WEATHER` |
| `earthquakes` | `EARTHQUAKE` |

**Usage example:**
```typescript
// Source: https://eonet.gsfc.nasa.gov/docs/v3
const INDIA_BBOX = '68.18,37.09,97.40,8.07'
const res = await fetch(
  `https://eonet.gsfc.nasa.gov/api/v3/events/geojson` +
  `?status=open&days=7&bbox=${INDIA_BBOX}`
)
const geojson = await res.json() as EONETGeoJSON
// Each feature has geometry.coordinates [lng, lat] and properties.categories[]
```

**Proximity matching to geohash:**
```typescript
import { encodeGeohash } from '@/lib/geo/geohash'

for (const feature of geojson.features) {
  const [lng, lat] = feature.geometry.coordinates as [number, number]
  const eventGeohash = encodeGeohash(lat, lng, 5) // precision-5 to match CoverageZone
  const category = mapEonetCategory(feature.properties.categories[0].id)
  // upsert RiskFactor for this geohash5
}
```

---

### Tier 2 — Free with API Key (Optional Upgrades)

#### 4. OpenWeatherMap One Call API 3.0
| Property | Value |
|----------|-------|
| Base URL | `https://api.openweathermap.org/data/3.0/onecall` |
| Auth | `&appid=OWM_API_KEY` (free tier: 1,000 calls/day) |
| Extra value over Open-Meteo | National weather alerts text, UV index |
| Env var | `OPENWEATHER_API_KEY` |
| Confidence | HIGH — well-known API |

**When to use:** Only valuable for weather alert text descriptions (e.g. "Cyclone watch issued for Odisha coast"). The structured severity can be fetched from Open-Meteo for free. **Recommended as optional enhancement**, not core.

---

#### 5. GDACS (Global Disaster Alert System)
| Property | Value |
|----------|-------|
| RSS Feed | `https://www.gdacs.org/xml/rss.xml` |
| Auth | None for RSS; limited JSON API |
| Alert levels | Red (major), Orange (moderate), Green (minor) |
| Types | Floods, earthquakes, cyclones, volcanoes |
| Confidence | MEDIUM — XML parsing required, no clean REST JSON |

**When to use:** For post-landfall cyclone tracking specifically. Open-Meteo + EONET covers the same events more conveniently. GDACS is a **fallback/supplement**.

---

#### 6. USGS Earthquake Feed
| Property | Value |
|----------|-------|
| Base URL | `https://earthquake.usgs.gov/fdsnws/event/1/query` |
| Auth | None |
| Params | `format=geojson&latitude=&longitude=&maxradiuskm=150&minmagnitude=4` |
| Confidence | HIGH — official USGS data |

**Severity mapping:**
```typescript
// Richter magnitude → severity
export function earthquakeMagnitudeToSeverity(magnitude: number): number {
  if (magnitude >= 7.0) return 1.0
  if (magnitude >= 6.0) return 0.8
  if (magnitude >= 5.0) return 0.6
  if (magnitude >= 4.0) return 0.4
  return 0.2
}
```

**Recommendation:** Use USGS only for zones near known seismic zones (Himalayan foothills, Andaman). Can be added as a future enhancement since EONET also captures significant earthquake events.

---

## Architecture Patterns

### Recommended Project Structure (additions only)
```
src/lib/ai/
├── predictive-engine.ts       # EXISTING — calculateZoneRisk, triggerProactiveSurge
├── live-risk-ingestion.ts     # NEW — fetchAndIngestLiveRiskFactors()
└── weather-severity.ts        # NEW — wmoCodeToSeverity, floodDischargeToSeverity

src/app/api/admin/risk/
├── calculate/route.ts         # EXISTING — will call ingestion before scoring
└── route.ts                   # EXISTING — manual RiskFactor CRUD

prisma/schema.prisma           # CHANGE — add FLOOD, EARTHQUAKE, WILDFIRE, STORM to enum
```

### Pattern 1: Ingestion-before-scoring in calculate endpoint
**What:** `POST /api/admin/risk/calculate` calls `ingestLiveRiskFactors()` first, then `runPredictiveEngineForAllZones()`.  
**When to use:** Always — ensures every analysis run uses fresh live data.

```typescript
// src/app/api/admin/risk/calculate/route.ts — updated
export async function POST() {
  // ...auth check...
  
  // 1. Ingest live weather + flood + events for all coverage zones
  const ingestResult = await ingestLiveRiskFactors()
  
  // 2. Run existing scoring engine (unchanged)
  const engineResult = await runPredictiveEngineForAllZones()
  
  return NextResponse.json({
    zonesAnalyzed: engineResult.zonesAnalyzed,
    surgesTriggered: engineResult.surgesTriggered,
    riskFactorsCreated: ingestResult.factorsCreated,
  })
}
```

### Pattern 2: Batched multi-location API call
**What:** Bundle all coverage zone centroids into a single Open-Meteo request (supports comma-separated lat/lng).  
**When to use:** Always — 50 zones = 1 API call, not 50.

```typescript
// Source: open-meteo.com/en/docs — multiple coordinates
export async function fetchWeatherBatch(
  zones: Array<{ geohash: string; lat: number; lng: number }>
) {
  const lats = zones.map(z => z.lat.toFixed(4)).join(',')
  const lngs = zones.map(z => z.lng.toFixed(4)).join(',')
  const url = `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lats}&longitude=${lngs}` +
    `&current=precipitation,weathercode,windspeed_10m,wind_gusts_10m` +
    `&forecast_days=1`
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`)
  const data = await res.json()
  // When multiple coords: data is an array of zone results
  return Array.isArray(data) ? data : [data]
}
```

### Pattern 3: RiskFactor upsert with TTL
**What:** Each live-sourced `RiskFactor` gets `expiresAt = now + 6h` so stale data never contributes to score after the TTL.

```typescript
// Upsert pattern — create if not exists for this geohash+category+source run
await prisma.riskFactor.create({
  data: {
    geohash: geohash5,
    category: 'WEATHER',            // or FLOOD, EARTHQUAKE, etc.
    severity,
    source: 'open-meteo',           // optional descriptor field (see schema note)
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours TTL
  },
})
```

> **Schema note:** Current `RiskFactor` has no `source` field. Either add one (recommended) or use a composite `expiresAt` distance to detect and replace same-category entries before recreating.

### Pattern 4: NGO layer on hotspot map
**What:** Server-side Prisma query returns verified NGOs with coordinates; client map renders them as a 4th checkbox-toggled layer.

```typescript
// In hotspots/page.tsx — alongside getHotspots() and getRiskZones()
async function getNGOLocations() {
  return prisma.ngo.findMany({
    where: { lat: { not: null }, lng: { not: null }, verified: true },
    select: { id: true, name: true, lat: true, lng: true, city: true, activeCaseCount: true },
  })
}
```

```typescript
// hotspot-map.tsx — new layer
if (showNGOs) {
  for (const ngo of ngos) {
    L.circleMarker([ngo.lat!, ngo.lng!], {
      radius: 8,
      color: '#16a34a',
      fillColor: '#22c55e',
      fillOpacity: 0.85,
      weight: 2,
    })
      .bindPopup(`<strong>${ngo.name}</strong><br>${ngo.city ?? ''}<br>${ngo.activeCaseCount} active cases`)
      .addTo(group)
  }
}
```

### Anti-Patterns to Avoid
- **Fetching weather per-zone sequentially:** 50 sequential API calls = ~15s timeout. Always batch.
- **Hardcoding discharge thresholds:** River discharge varies 10x between Himalayan and peninsular rivers. Use p25/p75 percentile bands from the same API call.
- **Storing raw API responses in RiskFactor:** Only store computed `severity` float + `category` enum. Keep the model clean.
- **Running EONET per-zone:** One bounding box call for all of India covers every zone. Do it once per analysis run, then proximity-match locally.
- **Duplicate live RiskFactors accumulating:** Delete or expire old live-sourced entries before inserting new ones. Add a `source` field OR delete `WHERE category IN ('WEATHER','FLOOD',...) AND createdAt > NOW()-1h` before ingestion.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Weather data | Custom scraper for IMD/iMD website | Open-Meteo REST API | IMD has no stable machine-readable API; Open-Meteo aggregates multiple NWP models |
| Flood risk | Custom GloFAS integration | Open-Meteo Flood API | GloFAS data distribution is complex NetCDF; Open-Meteo wraps it in clean JSON |
| Geohash encoder | Custom geohash library | Existing `@/lib/geo/geohash.ts` | Already in codebase, precision-5 confirmed working |
| Disaster alerts | Real-time WebSocket stream | Poll on analysis-button click | RESCURE is admin-triggered analysis, not continuous monitoring — polling is correct |
| Distance from disaster to geohash | Haversine + geohash lookup | `encodeGeohash(lat, lng, 5)` | Precision-5 cell is ~5km², same as GloFAS resolution; just encode event point |

---

## Schema Changes Required

### New `RiskCategory` enum values
```prisma
enum RiskCategory {
  WEATHER      // existing — manual / open-meteo weather code
  NOISE        // existing — manual
  CONSTRUCTION // existing — manual
  CROWD        // existing — manual
  FLOOD        // NEW — open-meteo flood API (river discharge)
  EARTHQUAKE   // NEW — USGS / EONET
  WILDFIRE     // NEW — EONET
  STORM        // NEW — EONET severeStorms / weathercode >= 80
}
```

**Migration command (project uses `prisma db push`):**
```bash
npx prisma db push
```

### Optional: `source` field on `RiskFactor`
```prisma
model RiskFactor {
  // ... existing fields ...
  source    String?  // "open-meteo" | "eonet" | "usgs" | "manual"
}
```
Enables efficient deletion of stale live-data records before re-ingestion.

---

## Common Pitfalls

### Pitfall 1: Open-Meteo returning `null` discharge for non-river zones
**What goes wrong:** `river_discharge` returns `null` for grid cells not near a river (open ocean, arid areas).  
**Why it happens:** GloFAS only models river networks; many cells have no river.  
**How to avoid:** Always null-check `discharge` before mapping to severity. Skip FLOOD factor creation if `null`.  
**Warning signs:** TypeScript errors on `discharge * multiplier` where discharge is `null`.

### Pitfall 2: EONET bbox is `minLon,maxLat,maxLon,minLat` (NOT `minLon,minLat,maxLon,maxLat`)
**What goes wrong:** Bounding box returns zero events or API error.  
**Why it happens:** EONET bbox format is non-standard — it's NW corner then SE corner.  
**How to avoid:** Use `bbox=68.18,37.09,97.40,8.07` exactly (West, North, East, South for India).

### Pitfall 3: Open-Meteo single-coord vs multi-coord response shape
**What goes wrong:** When only one zone exists, API returns a single object not an array.  
**Why it happens:** Multi-coord mode returns array; single-coord returns plain object.  
**How to avoid:** `const results = Array.isArray(data) ? data : [data]`

### Pitfall 4: `encodeGeohash` not exported from `@/lib/geo/geohash.ts`
**What goes wrong:** EONET proximity matching cant convert event lat/lng to geohash5.  
**Why it happens:** Current `geohash.ts` may only export `decodeGeohash`.  
**How to avoid:** Check exports; if `encodeGeohash` is missing, use the `ngeohash` npm package pattern or implement a simple precision-5 encoder inline.

### Pitfall 5: Severity accumulation — duplicate factors from multiple runs
**What goes wrong:** Running analysis 3 times creates 3× WEATHER factors per zone, tripling risk scores.  
**Why it happens:** `RiskFactor` rows are created, not upserted; old ones don't expire until their `expiresAt`.  
**How to avoid:** Before ingestion, delete existing non-expired live factors:
```typescript
await prisma.riskFactor.deleteMany({
  where: {
    geohash: geohash5,
    category: { in: ['WEATHER', 'FLOOD', 'STORM', 'EARTHQUAKE', 'WILDFIRE'] },
    expiresAt: { gt: new Date() },
    // only if source field added:
    source: { not: 'manual' }
  }
})
```

---

## Code Examples

### Full `live-risk-ingestion.ts` skeleton
```typescript
// src/lib/ai/live-risk-ingestion.ts
import { prisma } from '@/lib/prisma'
import { decodeGeohash } from '@/lib/geo/geohash'

const INDIA_EONET_BBOX = '68.18,37.09,97.40,8.07'
const EXPIRES_6H = () => new Date(Date.now() + 6 * 60 * 60 * 1000)

// WMO code → severity (0 = no factor created)
function wmoSeverity(code: number): number {
  if (code >= 95) return 0.9
  if (code >= 80) return 0.65
  if (code >= 65) return 0.55
  if (code >= 61) return 0.35
  if (code >= 51) return 0.18
  return 0
}

// Flood discharge → severity using percentiles
function floodSeverity(q: number | null, p25: number | null, p75: number | null): number {
  if (!q || !p25 || !p75) return 0
  if (q <= p25) return 0
  if (q <= p75) return 0.2
  const overshoot = (q - p75) / (p75 + 1)
  return Math.min(0.3 + overshoot * 0.5, 1.0)
}

export async function ingestLiveRiskFactors(): Promise<{ factorsCreated: number }> {
  // 1. Get all coverage zone centroids
  const zones = await prisma.coverageZone.findMany({
    select: { geohash: true },
    distinct: ['geohash'],
  })

  const decoded = zones.map(z => {
    const [minLat, minLng, maxLat, maxLng] = decodeGeohash(z.geohash)
    return { geohash: z.geohash, lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 }
  })

  let factorsCreated = 0

  // 2. Batch weather fetch (single API call for all zones)
  if (decoded.length > 0) {
    const lats = decoded.map(z => z.lat.toFixed(4)).join(',')
    const lngs = decoded.map(z => z.lng.toFixed(4)).join(',')

    const [weatherRes, floodRes] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=weathercode,precipitation,windspeed_10m&forecast_days=1`).then(r => r.json()),
      fetch(`https://flood-api.open-meteo.com/v1/flood?latitude=${lats}&longitude=${lngs}&daily=river_discharge,river_discharge_p25,river_discharge_p75&forecast_days=3`).then(r => r.json()),
    ])

    const weatherArr = Array.isArray(weatherRes) ? weatherRes : [weatherRes]
    const floodArr   = Array.isArray(floodRes)   ? floodRes   : [floodRes]

    for (let i = 0; i < decoded.length; i++) {
      const { geohash } = decoded[i]
      const expiresAt = EXPIRES_6H()

      // Delete stale live factors before creating fresh ones
      await prisma.riskFactor.deleteMany({
        where: { geohash, category: { in: ['WEATHER', 'FLOOD', 'STORM'] }, expiresAt: { gt: new Date() } },
      })

      // Weather factor
      const code = weatherArr[i]?.current?.weathercode ?? 0
      const severity = wmoSeverity(code)
      if (severity > 0) {
        const category = code >= 80 ? 'STORM' : 'WEATHER'
        await prisma.riskFactor.create({ data: { geohash, category, severity, expiresAt } })
        factorsCreated++
      }

      // Flood factor
      const q   = floodArr[i]?.daily?.river_discharge?.[0] ?? null
      const p25 = floodArr[i]?.daily?.river_discharge_p25?.[0] ?? null
      const p75 = floodArr[i]?.daily?.river_discharge_p75?.[0] ?? null
      const floodSev = floodSeverity(q, p25, p75)
      if (floodSev > 0) {
        await prisma.riskFactor.create({ data: { geohash, category: 'FLOOD', severity: floodSev, expiresAt } })
        factorsCreated++
      }
    }
  }

  // 3. EONET scan — one call for all of India
  try {
    const eonetRes = await fetch(
      `https://eonet.gsfc.nasa.gov/api/v3/events/geojson?status=open&days=7&bbox=${INDIA_EONET_BBOX}`
    ).then(r => r.json()) as { features: EONETFeature[] }

    const EONET_MAP: Record<string, string> = {
      severeStorms: 'STORM',
      floods:       'FLOOD',
      wildfires:    'WILDFIRE',
      earthquakes:  'EARTHQUAKE',
      landslides:   'WEATHER',
    }

    for (const feature of eonetRes.features ?? []) {
      const coords = feature.geometry?.coordinates
      if (!coords) continue
      const [lng, lat] = Array.isArray(coords[0]) ? coords[0] : coords as [number, number]
      const catId = feature.properties?.categories?.[0]?.id ?? ''
      const category = EONET_MAP[catId]
      if (!category) continue

      // Find nearest coverage zone geohash5
      const gh5 = await nearestCoverageZone(lat as number, lng as number, decoded)
      if (!gh5) continue

      const expiresAt = EXPIRES_6H()
      await prisma.riskFactor.create({ data: { geohash: gh5, category: category as never, severity: 0.7, expiresAt } })
      factorsCreated++
    }
  } catch {
    // EONET is non-critical — log but don't block
    console.warn('EONET fetch failed — continuing without event data')
  }

  return { factorsCreated }
}

// Find geohash5 of decoded zone nearest to the event point
function nearestCoverageZone(
  lat: number, lng: number,
  zones: Array<{ geohash: string; lat: number; lng: number }>
): string | null {
  let best: string | null = null
  let bestDist = Infinity
  for (const z of zones) {
    const d = Math.hypot(z.lat - lat, z.lng - lng)
    if (d < bestDist && d < 1.5) { // max ~165 km proximity
      bestDist = d
      best = z.geohash
    }
  }
  return best
}

interface EONETFeature {
  geometry?: { coordinates: number[] | number[][] }
  properties?: { categories?: Array<{ id: string }> }
}
```

### NGO layer fetch (hotspot page server component)
```typescript
// In src/app/hotspots/page.tsx
async function getNGOLocations() {
  return prisma.ngo.findMany({
    where: { lat: { not: null }, lng: { not: null }, verified: true },
    select: { id: true, name: true, lat: true, lng: true, city: true, activeCaseCount: true },
    orderBy: { activeCaseCount: 'desc' },
    take: 100,
  })
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual-only RiskFactor POST | Auto-ingestion from live APIs on analysis run | This phase | Risk scores reflect real-world conditions |
| WEATHER only from manual input | WEATHER + FLOOD + STORM + EARTHQUAKE + WILDFIRE | This phase | 5× signal coverage |
| No NGO layer on map | Green NGO pins as 4th toggleable layer | This phase | Admins see coverage gaps instantly |
| Single API call returns 1 zone | Batched comma-separated lat/lng | This phase | 50 zones = 1 network round-trip |

---

## Open Questions

1. **`encodeGeohash` availability**
   - What we know: `decodeGeohash` is confirmed exported from `@/lib/geo/geohash.ts`
   - What's unclear: Whether `encodeGeohash` is exported or implemented
   - Recommendation: Check file at start of Wave 1; if missing, add it or use `ngeohash` package

2. **Open-Meteo rate limits for large zone sets**
   - What we know: 10,000 calls/day free; batching reduces calls to 2 (weather + flood) regardless of zone count
   - What's unclear: Whether the API handles 50+ comma-separated coords in one call
   - Recommendation: Test with actual CoverageZone count; if > 100 zones, chunk into groups of 50

3. **River discharge baselines for India**
   - What we know: Open-Meteo Flood API returns p25/p75 percentiles alongside forecast
   - What's unclear: Whether GloFAS has good resolution for Indian peninsular rivers (Godavari, Krishna) vs just Himalayan
   - Recommendation: Note may return `null` for arid zones; null-guard is mandatory

---

## Sources

### Primary (HIGH confidence)
- `https://open-meteo.com/en/docs` — weather API endpoint, params, WMO code table, batch coords doc
- `https://open-meteo.com/en/docs/flood-api` — GloFAS v4 endpoint, river_discharge, percentile vars
- `https://eonet.gsfc.nasa.gov/docs/v3` — EONET event GeoJSON endpoint, bbox filter, category IDs

### Secondary (MEDIUM confidence)
- `https://www.gdacs.org/Knowledge/Overview.aspx` — GDACS scope, RSS feed availability
- USGS FDSNWS docs — earthquake query API endpoint and params

### Tertiary (LOW confidence, not used in implementation)
- IMD (India Meteorological Department) — no stable machine-readable public API identified; website scraping is fragile

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — open-meteo and EONET verified from official docs
- Architecture: HIGH — follows existing RESCURE patterns (server-side Prisma + predictive engine service)
- Pitfalls: HIGH — batching shape-detection is a known open-meteo gotcha; EONET bbox order is documented

**Research date:** 2026-03-01  
**Valid until:** 2026-06-01 (Open-Meteo and EONET are stable APIs; review if GloFAS version changes)
