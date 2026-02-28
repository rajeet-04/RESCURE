---
phase: "03-predictive-engine"
plan: "03-03"
subsystem: "surge system migration"
tags: [api, surge, model-migration]
dependency-graph:
  requires: [03-01]
  provides: [SurgeEvent-based surge CRUD, migrated surge pages]
  affects: [src/app/api/surge/route.ts, src/app/surge/page.tsx, src/app/(admin)/admin/surge/page.tsx]
tech-stack:
  added: []
  patterns: [Prisma model query substitution]
key-files:
  created: []
  modified:
    - src/app/api/surge/route.ts
    - src/app/surge/page.tsx
    - src/app/(admin)/admin/surge/page.tsx
decisions:
  - "SurgeEvent replaces Notification.type=SURGE_EVENT for all surge data storage and retrieval"
  - "SURGE_ALERT notifications (citizen push batch) remain in Notification table — only SURGE_EVENT storage moves"
metrics:
  duration: "~15min"
  completed: "2025-03-01"
  tasks: 1
  files: 3
---

# Phase 03 Plan 03: Surge System Migration Summary

Surge system migrated from `Notification.type=SURGE_EVENT` hack to the dedicated `SurgeEvent` model across the API route, public surge page, and admin surge control panel.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Surge API + pages migration | `421fb79` | surge/route.ts, surge/page.tsx, admin/surge/page.tsx |

## Key Changes

### src/app/api/surge/route.ts
- GET: now queries `prisma.surgeEvent.findMany({ where: { isActive: true } })` instead of old Notification hack
- POST: creates `SurgeEvent` row (isProactive: false) + batch SURGE_ALERT notifications for citizens + push

### src/app/surge/page.tsx
- `getSurgeEvents()` replaced `prisma.notification.findMany({ where: { type: 'SURGE_EVENT' } })` with `prisma.surgeEvent.findMany`
- Field mapping: `description: e.reason ?? ''`, `lat: e.lat`, `lng: e.lng`, `radius: e.radiusKm`

### src/app/(admin)/admin/surge/page.tsx
- `recentSurges` query updated to `prisma.surgeEvent.findMany`
- JSX updated: `surge.body` → `surge.reason ?? ''`, `payload?.radius` → `surge.radiusKm`, payload destructure removed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Duplicate POST function from previous session's partial file replacement**
- **Found during:** Task 1
- **Issue:** Previous session's `multi_replace_string_in_file` replaced only the GET function (oldString) with entire file content (newString), leaving old POST function still appended
- **Fix:** Read file, identified duplicate, removed old POST handler using targeted `replace_string_in_file`
- **Files modified:** src/app/api/surge/route.ts
- **Commit:** `421fb79`

## Self-Check: PASSED
- `src/app/api/surge/route.ts` (SurgeEvent-based): ✅ exists, no duplicate POST
- `src/app/surge/page.tsx` (updated getSurgeEvents): ✅ exists
- `src/app/(admin)/admin/surge/page.tsx` (updated recentSurges): ✅ exists
- Commit `421fb79`: ✅ exists
