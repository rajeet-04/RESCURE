---
phase: "03-predictive-engine"
plan: "03-01"
subsystem: "schema + engine service"
tags: [prisma, ai, risk-engine]
dependency-graph:
  requires: []
  provides: [RiskFactor model, SurgeEvent model, predictive-engine service]
  affects: [prisma/schema.prisma, src/lib/ai/]
tech-stack:
  added: []
  patterns: [Prisma schema extension, service layer]
key-files:
  created: [src/lib/ai/predictive-engine.ts]
  modified: [prisma/schema.prisma]
decisions:
  - "Used `prisma db push` instead of `prisma migrate dev` — DB has data without migration history baseline"
  - "DIRECT_URL uses session pooler (port 5432) not direct DB host (unreachable)"
  - "BASE_RISK = 0.1, SURGE_THRESHOLD = 0.6 — configurable constants at top of engine"
metrics:
  duration: "~20min"
  completed: "2025-03-01"
  tasks: 2
  files: 2
---

# Phase 03 Plan 01: Predictive Schema + Engine Service Summary

Prisma schema extended with `RiskFactor`, `SurgeEvent`, and `CoverageZone.baseRiskScore`; predictive engine service with `calculateZoneRisk`, `triggerProactiveSurge`, and `runPredictiveEngineForAllZones`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Schema migration | `5ec95f3` | prisma/schema.prisma |
| 2 | Predictive engine service | `5ec95f3` | src/lib/ai/predictive-engine.ts |

## Key Changes

### prisma/schema.prisma
- Added `RiskCategory` enum: `WEATHER | NOISE | CONSTRUCTION | CROWD`
- Added `baseRiskScore Float @default(0.1)` to `CoverageZone`
- Added `RiskFactor` model with geohash-indexed risk data (severity 0-1, expiry)
- Added `SurgeEvent` model replacing the `Notification.type=SURGE_EVENT` hack

### src/lib/ai/predictive-engine.ts
- `calculateZoneRisk(geohash5)` — sums active RiskFactor severities + 0.1 base, triggers proactive surge if >0.6
- `triggerProactiveSurge(geohash, score)` — dedup guard, decodes geohash, creates SurgeEvent + push to NGO_WORKER
- `runPredictiveEngineForAllZones()` — iterates distinct CoverageZone geohashes, returns stats

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] `prisma migrate dev` blocked by drift detection**
- **Found during:** Task 1 (DB migration)
- **Issue:** DB has existing tables but no migration history. `migrate dev` detected drift and required destructive reset.
- **Fix:** Switched to `prisma db push` which syncs schema without requiring migration history.
- **Files modified:** None — command change only
- **Commit:** N/A (command-level fix)

**2. [Rule 3 - Blocker] Prisma CLI cannot read .env.local**
- **Found during:** Task 1
- **Issue:** `DATABASE_URL` and `DIRECT_URL` not available to Prisma CLI
- **Fix:** Set env vars inline in PowerShell session before running Prisma commands
- **Files modified:** None

## Self-Check: PASSED
- `src/lib/ai/predictive-engine.ts`: ✅ exists
- `prisma/schema.prisma` (RiskFactor, SurgeEvent): ✅ exists
- Commit `5ec95f3`: ✅ exists
