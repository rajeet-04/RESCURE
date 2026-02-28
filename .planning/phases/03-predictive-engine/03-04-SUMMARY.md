---
phase: "03-predictive-engine"
plan: "03-04"
subsystem: "hotspot map UI"
tags: [ui, map, leaflet, predictive-overlay]
dependency-graph:
  requires: [03-01, 03-02]
  provides: [predictive risk overlay, run-analysis button, toggleable map layers]
  affects: [src/app/hotspots/, src/components/maps/]
tech-stack:
  added: []
  patterns: [react-leaflet custom control, useState toggle layers, Leaflet L.Control]
key-files:
  created:
    - src/app/hotspots/_components/run-analysis-btn.tsx
  modified:
    - src/app/hotspots/page.tsx
    - src/app/hotspots/_components/hotspot-map.tsx
    - src/components/maps/hotspot-map-loader.tsx
decisions:
  - "Inline state-based feedback for RunAnalysisBtn instead of sonner/toast (not installed, no Toaster in layout)"
  - "getRiskZones() uses direct Prisma queries in server component (same pattern as getHotspots)"
  - "MapLegend implemented as react-leaflet child using L.Control + useMap() + useEffect cleanup"
  - "Predictive layer colors: #9333ea for score >=0.6, #c084fc for 0.3-0.6"
metrics:
  duration: "~20min"
  completed: "2025-03-01"
  tasks: 2
  files: 4
---

# Phase 03 Plan 04: Hotspot Predictive Map Overlay Summary

Hotspot map extended with toggleable predictive risk overlay: purple CircleMarkers for risk zones sourced from CoverageZone + RiskFactor data, "Run Analysis" admin button, and a dynamic legend. Historical and predictive layers independently toggled via checkboxes.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Page data + RunAnalysisBtn | `6fd27b1` | hotspots/page.tsx, run-analysis-btn.tsx, hotspot-map-loader.tsx |
| 2 | Map predictive layer + toggles | `6fd27b1` | hotspot-map.tsx |

## Key Changes

### src/app/hotspots/page.tsx
- Added `getRiskZones()` — parallel Prisma queries: CoverageZone distinct geohashes → active RiskFactors → SurgeEvent count per zone
- Changed to `Promise.all([getHotspots(days), getRiskZones()])` for parallel data fetch
- Added `<RunAnalysisBtn userRole={user.role} />` in header (visible only to PLATFORM_ADMIN)
- Passes `riskZones` and `userRole` to `HotspotMapLoader`

### src/app/hotspots/_components/run-analysis-btn.tsx (NEW)
- Client component, returns null for non-PLATFORM_ADMIN
- POSTs to `/api/admin/risk/calculate`, shows inline success/error with auto-dismiss after 4s

### src/components/maps/hotspot-map-loader.tsx
- Extended to accept and forward `riskZones: RiskZone[]` and `userRole: string`

### src/app/hotspots/_components/hotspot-map.tsx
- Added `RiskZone` interface and extended `HotspotMapProps`
- Added `showHistorical` and `showPredictive` toggle state with checkbox UI above map
- Historical CircleMarkers now keyed `h-${geohash}` (conditional on `showHistorical`)
- Predictive CircleMarkers keyed `p-${geohash}`: purple (#9333ea ≥0.6, #c084fc <0.6), radius = 8+score×18, dashed stroke for active surges
- `MapLegend` child component using `useMap()` + `L.Control` with dynamic content based on active layers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] `sonner` not installed (no toast infrastructure)**
- **Found during:** Task 1 (TypeScript check)
- **Issue:** `run-analysis-btn.tsx` imported `sonner` which wasn't in package.json
- **Fix:** Replaced toast calls with inline state-based feedback (status: idle|loading|success|error) — self-contained, no external dep
- **Files modified:** src/app/hotspots/_components/run-analysis-btn.tsx
- **Commit:** `6fd27b1`

## Self-Check: PASSED
- `src/app/hotspots/_components/run-analysis-btn.tsx`: ✅ exists
- `src/app/hotspots/page.tsx` (getRiskZones + RunAnalysisBtn): ✅ exists
- `src/components/maps/hotspot-map-loader.tsx` (riskZones + userRole): ✅ exists
- `src/app/hotspots/_components/hotspot-map.tsx` (toggles + predictive layer + MapLegend): ✅ exists
- Commit `6fd27b1`: ✅ exists
