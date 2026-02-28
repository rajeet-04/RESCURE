# RESCURE — Planning State

## Current Phase

Phase `01-animations` — **COMPLETE**

## Next Phase

Phase `02-report-wizard-ngo` — **PLANNED** (0/4 plans done) (3/3 plans done)

## Stack (Confirmed)

- Next.js 16.1.6 (App Router, Server Components)
- React 18 with TypeScript
- Tailwind CSS + tailwindcss-animate (existing)
- pnpm package manager
- framer-motion 12.34.3 (installed Plan 01-01)
- gsap 3.14.2 + ScrollTrigger (installed Plan 01-01)
- Primary color: `--primary: 142 76% 36%` (green)

## Key Constraints

- `src/app/page.tsx` is an **async Server Component** — animation logic must be extracted to `'use client'` sub-components
- All GSAP code must run in `useEffect` / `useGSAP` with cleanup via `gsap.context().revert()`
- Must register GSAP plugins once globally (ScrollTrigger, etc.)
- Next.js Strict Mode may double-invoke effects — use `once: true` on ScrollTrigger or guard with refs

## Decisions

- Use `framer-motion` for declarative React animations (entrance, page transitions, hover)
- Use `gsap` + `gsap/ScrollTrigger` for scroll-coupled/scrub animations and parallax effects
- Extract landing page sections into `'use client'` wrapper components under `src/app/_components/`
- `SiteHeader` extracted from `HeroSection` for DRY nav + scroll effect
- `PageTransition` uses `AnimatePresence` + `usePathname` as thin client wrapper in Server layout
- `ScrollAnimationObserver` decommissioned (returns null) — not deleted to avoid import breaks

## Completed Plans

| Plan | Name | Commit | Status |
|------|------|--------|--------|
| 01-01 | Animation primitive library | `6e90104` | ✅ |
| 01-02 | Hero, Stats, Steps, Features sections | `4497ac0` | ✅ |
| 01-03 | CTA animations, page transitions, nav scroll | `d96e2b8` | ✅ |

## Last Session

Stopped at: Phase 01-animations — all plans complete. Human verify checkpoint pending (Task 3 of Plan 01-03).


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
