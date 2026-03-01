---
phase: "04-live-data-feeds"
plan: "01"
subsystem: "live-data-ingestion"
tags: [live-data, risk-factors, open-meteo, eonet, owm, prisma]
dependency_graph:
  requires: []
  provides: ["live-risk-ingestion", "updated-risk-schema", "ingestion-before-scoring"]
  affects: ["risk-scoring", "predictive-engine", "hotspot-map"]
tech_stack:
  added: []
  patterns: ["fetch-before-score", "batched-api", "stale-delete-create", "optional-enrichment"]
key_files:
  created:
    - src/lib/ai/live-risk-ingestion.ts
  modified:
    - prisma/schema.prisma
    - .env.example
    - src/app/api/admin/risk/calculate/route.ts
    - src/app/hotspots/_components/run-analysis-btn.tsx
key_decisions:
  - "Batch Open-Meteo requests: comma-separated lat/lng → 2 HTTP calls total (weather + flood) instead of 2×N"
  - "Delete stale live factors before creating new ones (source != null, expiresAt > now) — prevents severity accumulation"
  - "EONET is non-critical: wrapped in try/catch, failure is logged, execution continues"
  - "OWM enrichment is optional: guarded by process.env.OPENWEATHER_API_KEY check"
  - "6-hour TTL on all live factors: expiresAt = now + 6h"
  - "Fixed Prisma client accessor: prisma.nGO (not prisma.ngo) — Rule 1 auto-fix during tsc"
metrics:
  duration: "~25 minutes (continuation from prev session)"
  completed: "2026-03-01"
  tasks_completed: 2
  files_changed: 7
---

# Phase 04 Plan 01: Live Risk Ingestion Summary

**One-liner:** Open-Meteo + GloFAS + EONET live risk ingestion with stale-delete-create pattern, running before each predictive engine cycle.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Schema: FLOOD/EARTHQUAKE/WILDFIRE/STORM enum + source field | 8f39550 | prisma/schema.prisma, .env.example |
| 2 | Create live-risk-ingestion.ts service | 8f39550 | src/lib/ai/live-risk-ingestion.ts |
| 3 | Update calculate route + run-analysis-btn | 8f39550 | route.ts, run-analysis-btn.tsx |

## What Was Built

### `src/lib/ai/live-risk-ingestion.ts`
Exports `ingestLiveRiskFactors(): Promise<{ factorsCreated: number }>`.

1. **Load zones** — Queries all distinct `coverageZone.geohash`, decodes each to centroid lat/lng
2. **Batched weather + flood** — Single `Promise.all` with comma-separated coords → 2 HTTP calls total
   - Open-Meteo: WMO code → WEATHER (sev 0.12–0.55) or STORM (sev 0.65–0.9) factors
   - GloFAS: discharge vs p25/p75 → FLOOD factors (0–1.0)
3. **EONET India scan** — `bbox=68.18,37.09,97.40,8.07`, maps category IDs → RiskCategory, nearest zone within 1.5°; wrapped in try/catch (non-critical)
4. **Optional OWM** — Per-zone if `OPENWEATHER_API_KEY` is set → STORM factor (sev 0.75) per active alert
5. **Stale-delete-create** — Before each zone, deletes non-manual live factors not yet expired

### Schema Changes
```prisma
enum RiskCategory {
  WEATHER  NOISE  CONSTRUCTION  CROWD
  FLOOD  EARTHQUAKE  WILDFIRE  STORM   # NEW
}

model RiskFactor {
  ...
  source    String?  // "open-meteo" | "eonet" | "owm" | null=manual
}
```

### Calculate Route
```typescript
const { factorsCreated } = await ingestLiveRiskFactors()
const { zonesAnalyzed, surgesTriggered } = await runPredictiveEngineForAllZones()
return NextResponse.json({ zonesAnalyzed, surgesTriggered, riskFactorsCreated: factorsCreated })
```

### Run Analysis Button
Message: `"12 signals ingested · 5 zones scored · 2 surges triggered"`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Prisma accessor casing**
- **Found during:** TypeScript check (tsc --noEmit)
- **Issue:** Used `prisma.ngo.findMany()` but Prisma client generates `prisma.nGO` for the `NGO` model
- **Fix:** Changed to `prisma.nGO.findMany()` in page.tsx
- **Files modified:** src/app/hotspots/page.tsx
- **Commit:** 8f39550

**2. [Rule 3 - Blocker] prisma generate failed due to dev server DLL lock**
- **Found during:** Running `npx prisma generate`
- **Issue:** Windows file lock (EPERM) — dev server held `query_engine-windows.dll.node`
- **Fix:** Stopped Node processes, ran generate, dev server needs manual restart
- **Commit:** N/A (infrastructure fix, no files changed)

## Self-Check: PASSED
- [x] `src/lib/ai/live-risk-ingestion.ts` exists
- [x] `prisma/schema.prisma` contains FLOOD/STORM/EARTHQUAKE/WILDFIRE
- [x] `src/app/api/admin/risk/calculate/route.ts` imports `ingestLiveRiskFactors`
- [x] `npx tsc --noEmit` passes with zero errors
- [x] commit `8f39550` exists
