# RESCURE — Planning State

## Previous Phase

Phase `03-predictive-engine` — **COMPLETE** (4/4 plans done)

## Current Phase

Phase `04-live-data-feeds` — **IN PROGRESS** (2/3 plans done)

Current Plan: 3 (04-03 — human verification checkpoint)

## Stack (Confirmed)

- Next.js 16.1.6 (App Router, Server Components)
- React 18 with TypeScript
- Tailwind CSS + tailwindcss-animate (existing)
- pnpm package manager
- framer-motion 12.34.3 (installed Plan 01-01)
- gsap 3.14.2 + ScrollTrigger (installed Plan 01-01)
- Prisma 5.22.0 + Supabase PostgreSQL
- react-leaflet (hotspot map)
- Primary color: `--primary: 142 76% 36%` (green)

## Key Constraints

- `src/app/page.tsx` is an **async Server Component** — animation logic must be extracted to `'use client'` sub-components
- All GSAP code must run in `useEffect` / `useGSAP` with cleanup via `gsap.context().revert()`
- Must register GSAP plugins once globally (ScrollTrigger, etc.)
- Next.js Strict Mode may double-invoke effects — use `once: true` on ScrollTrigger or guard with refs
- `prisma db push` (not `migrate dev`) — DB has no migration history baseline
- DIRECT_URL must use session pooler port 5432 (direct DB host unreachable from dev)

## Decisions

- Use `framer-motion` for declarative React animations (entrance, page transitions, hover)
- Use `gsap` + `gsap/ScrollTrigger` for scroll-coupled/scrub animations and parallax effects
- Extract landing page sections into `'use client'` wrapper components under `src/app/_components/`
- `SiteHeader` extracted from `HeroSection` for DRY nav + scroll effect
- `PageTransition` uses `AnimatePresence` + `usePathname` as thin client wrapper in Server layout
- `ScrollAnimationObserver` decommissioned (returns null) — not deleted to avoid import breaks
- SurgeEvent model replaces `Notification.type=SURGE_EVENT` hack for all surge data
- Predictive engine: BASE_RISK=0.1, SURGE_THRESHOLD=0.6
- getRiskZones() uses direct Prisma queries server-side (same pattern as getHotspots)
- Inline state feedback for RunAnalysisBtn (sonner not installed, no Toaster in layout)

## Completed Plans

| Plan | Name | Commit | Status |
|------|------|--------|--------|
| 01-01 | Animation primitive library | `6e90104` | ✅ |
| 01-02 | Hero, Stats, Steps, Features sections | `4497ac0` | ✅ |
| 01-03 | CTA animations, page transitions, nav scroll | `d96e2b8` | ✅ |
| 03-01 | RiskFactor + SurgeEvent schema + predictive engine service | `5ec95f3` | ✅ |
| 03-02 | Risk factor APIs + engine trigger + risk-zones endpoint | `cfe339d` | ✅ |
| 03-03 | Surge system migration to SurgeEvent model | `421fb79` | ✅ |
| 03-04 | Predictive risk overlay on hotspot map | `6fd27b1` | ✅ |
| 04-01 | Live risk ingestion (Open-Meteo + EONET + OWM) | `8f39550` | ✅ |
| 04-02 | NGO locations map layer | `8f39550` | ✅ |

## Last Session

Stopped at: Phase 04-live-data-feeds — 04-01 and 04-02 complete, awaiting 04-03 (human verification checkpoint).


## Phase 02 Decisions (LOCKED)

- Use Google Maps `tbm=map` scraper (data/f.txt format confirmed) — NOT Google Places API
- Use Bitrix24 REST webhook API for CRM lead creation — NOT Twilio
- Gemini model升级: `gemini-2.0-flash` (unified analyzer) replacing `gemini-1.5-flash`
- Report page: 2-step wizard, state machine: capture → analyzing → review → submitted
- Internal endpoint security via `x-internal-key` header matching `INTERNAL_API_KEY` env var
- `NGOOutreach` model logs all contact attempts (source: google_maps | db)
- Reporter contact info remains optional in Step 2

## Phase 02 New Env Vars

- `BITRIX24_WEBHOOK_URL` — Bitrix24 REST webhook (format: https://portal.bitrix24.com/rest/userId/token/)
- `INTERNAL_API_KEY` — shared secret for internal fire-and-forget endpoints
