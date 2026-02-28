---
phase: "03-predictive-engine"
plan: "03-02"
subsystem: "risk APIs"
tags: [api, risk-engine, admin]
dependency-graph:
  requires: [03-01]
  provides: [/api/admin/risk, /api/admin/risk/calculate, /api/analytics/risk-zones]
  affects: [src/app/api/]
tech-stack:
  added: []
  patterns: [Next.js App Router API routes, PLATFORM_ADMIN auth guard]
key-files:
  created:
    - src/app/api/admin/risk/route.ts
    - src/app/api/admin/risk/calculate/route.ts
    - src/app/api/analytics/risk-zones/route.ts
  modified: []
decisions:
  - "risk-zones GET decodes geohash in-memory (no PostGIS) using decodeGeohash utility"
  - "calculate endpoint returns { zonesAnalyzed, surgesTriggered } for UI feedback"
metrics:
  duration: "~15min"
  completed: "2025-03-01"
  tasks: 2
  files: 3
---

# Phase 03 Plan 02: Risk Factor APIs Summary

Three API routes created: risk factor CRUD (`/api/admin/risk`), engine trigger (`/api/admin/risk/calculate`), and per-zone risk scores for map overlay (`/api/analytics/risk-zones`).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Risk factor ingestion + listing | `cfe339d` | src/app/api/admin/risk/route.ts |
| 2 | Engine trigger + risk zones endpoint | `cfe339d` | src/app/api/admin/risk/calculate/route.ts, src/app/api/analytics/risk-zones/route.ts |

## Key Changes

### /api/admin/risk (GET + POST)
- GET: returns active (non-expired) risk factors — requires PLATFORM_ADMIN or NGO_ADMIN
- POST: validates geohash/category/severity(0-1)/expiresAt, creates RiskFactor — PLATFORM_ADMIN only

### /api/admin/risk/calculate (POST)
- PLATFORM_ADMIN only trigger for `runPredictiveEngineForAllZones()`
- Returns `{ zonesAnalyzed, surgesTriggered }`

### /api/analytics/risk-zones (GET)
- PLATFORM_ADMIN or NGO_ADMIN
- Fetches distinct CoverageZone geohashes, computes per-zone risk score + active surge count
- Decodes geohash to lat/lng center using `decodeGeohash`
- Returns `{ geohash, lat, lng, riskScore, hasActiveSurge, factors }[]`

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED
- `src/app/api/admin/risk/route.ts`: ✅ exists
- `src/app/api/admin/risk/calculate/route.ts`: ✅ exists
- `src/app/api/analytics/risk-zones/route.ts`: ✅ exists
- Commit `cfe339d`: ✅ exists
