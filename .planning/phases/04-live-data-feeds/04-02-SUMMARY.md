---
phase: "04-live-data-feeds"
plan: "02"
subsystem: "hotspot-map"
tags: [map, leaflet, ngo-layer, ui]
dependency_graph:
  requires: []
  provides: ["ngo-map-layer", "ngo-data-fetch"]
  affects: ["hotspot-map", "hotspot-page"]
tech_stack:
  added: []
  patterns: ["imperative-leaflet", "server-component-query", "prop-drilling", "toggle-checkbox"]
key_files:
  created: []
  modified:
    - src/app/hotspots/page.tsx
    - src/components/maps/hotspot-map-loader.tsx
    - src/app/hotspots/_components/hotspot-map.tsx
key_decisions:
  - "NGO data fetched server-side in page.tsx via getNGOLocations() — verified=true, lat/lng not null, top 100 by activeCaseCount"
  - "NGO color is #16a34a (Tailwind green-700) matching project primary color convention"
  - "showNGOs defaults to true — NGO pins visible on first load"
  - "NGO layer uses radius=7 fixed (not proportional like incidents) to distinguish from incident markers"
metrics:
  duration: "~5 minutes (parallel with 04-01)"
  completed: "2026-03-01"
  tasks_completed: 1
  files_changed: 3
---

# Phase 04 Plan 02: NGO Locations Map Layer Summary

**One-liner:** 4th toggleable NGO layer on hotspot map — green pins for verified NGOs, sourced from live DB, with popup showing name/city/caseCount.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | NGO layer + data fetch + checkbox + legend | 8f39550 | page.tsx, hotspot-map-loader.tsx, hotspot-map.tsx |

## What Was Built

### `src/app/hotspots/page.tsx`
Added `NGOLocation` interface and `getNGOLocations()` server query:
```typescript
async function getNGOLocations(): Promise<NGOLocation[]> {
  const rows = await prisma.nGO.findMany({
    where: { lat: { not: null }, lng: { not: null }, verified: true },
    select: { id, name, lat, lng, city, activeCaseCount },
    orderBy: { activeCaseCount: 'desc' },
    take: 100,
  })
  return rows as NGOLocation[]
}
```
Updated Promise.all: `const [hotspots, riskZones, ngos] = await Promise.all([...])`

### `src/components/maps/hotspot-map-loader.tsx`
Added `NGOLocation` interface + `ngos: NGOLocation[]` prop + forwarded to HotspotMap.

### `src/app/hotspots/_components/hotspot-map.tsx`
- `NGOLocation` interface + `ngos = []` default in destructuring
- `const [showNGOs, setShowNGOs] = useState(true)`
- `buildLegendHtml` gains `showNGOs` param + green NGO legend entry
- `drawLayers` gains NGO block (green circleMarker r=7, popup with name/city/cases) + deps array updated
- Legend useEffect updated to pass `showNGOs` + include in deps
- 3rd toolbar checkbox: "NGO locations" with `accent-green-600`

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED
- [x] `src/app/hotspots/page.tsx` contains `getNGOLocations`
- [x] `src/app/hotspots/_components/hotspot-map.tsx` contains `showNGOs`
- [x] `src/components/maps/hotspot-map-loader.tsx` forwards `ngos={ngos}`
- [x] `npx tsc --noEmit` passes with zero errors
- [x] commit `8f39550` exists
