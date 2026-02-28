# RESCURE — Planning State

## Current Phase

Phase `01-animations` — not started

## Stack (Confirmed)

- Next.js 16.1.6 (App Router, Server Components)
- React 18 with TypeScript
- Tailwind CSS + tailwindcss-animate (existing)
- pnpm package manager
- Primary color: `--primary: 142 76% 36%` (green)
- No animation libraries installed yet (only CSS keyframes via tailwindcss-animate)

## Key Constraints

- `src/app/page.tsx` is an **async Server Component** — animation logic must be extracted to `'use client'` sub-components
- All GSAP code must run in `useEffect` / `useGSAP` with cleanup via `gsap.context().revert()`
- Must register GSAP plugins once globally (ScrollTrigger, etc.)
- Next.js Strict Mode may double-invoke effects — use `once: true` on ScrollTrigger or guard with refs

## Decisions

- Use `framer-motion` for declarative React animations (entrance, page transitions, hover)
- Use `gsap` + `gsap/ScrollTrigger` for scroll-coupled/scrub animations and parallax effects
- Extract landing page sections into `'use client'` wrapper components under `src/app/_components/`
- Keep `ScrollAnimationObserver.tsx` but replace its logic with the new system in Plan 01-02

## Pending

- Phase 01-animations: plan and execute
