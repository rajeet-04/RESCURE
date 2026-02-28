---
status: investigating
trigger: "Map container is already initialized."
created: 2026-03-01T02:22:00Z
updated: 2026-03-01T02:22:00Z
---

## Current Focus
hypothesis: The MapContainer component from react-leaflet doesn't handle React 18 Strict Mode double-invocations or Next.js Fast Refresh properly without proper keying or cleanup.
test: Reading `src/app/hotspots/_components/hotspot-map.tsx`
expecting: I expect to see `MapContainer` being used.
next_action: read `src/app/hotspots/_components/hotspot-map.tsx`

## Symptoms
expected: Map should load properly.
actual: Runtime Error: "Map container is already initialized."
errors: "Map container is already initialized." at HotspotMapInner (src/app/hotspots/_components/hotspot-map.tsx:136:9)
reproduction: Page load/HMR with Turbopack next.js.
started: Now

## Eliminated

## Evidence

## Resolution
root_cause: 
fix: 
verification: 
files_changed: []
