---
phase: 01-animations
plan: "03"
subsystem: landing-page-animations
tags: [framer-motion, gsap, page-transitions, animate-presence, sticky-nav]
dependency_graph:
  requires: [01-01, 01-02]
  provides: [cta-animations, page-transitions, sticky-nav-effect]
  affects: [src/app/layout.tsx, src/app/page.tsx, src/app/_components/]
tech_stack:
  added: []
  patterns: [animate-presence, use-pathname, gsap-scroll-trigger-create, client-wrapper-in-server-layout]
key_files:
  created:
    - src/app/_components/cta-sections.tsx
    - src/app/_components/page-transition.tsx
    - src/app/_components/site-header.tsx
  modified:
    - src/app/_components/hero-section.tsx
    - src/app/page.tsx
    - src/app/layout.tsx
    - src/components/ScrollAnimationObserver.tsx
decisions:
  - "SiteHeader extracted from HeroSection to own component for DRY nav + scroll effect"
  - "PageTransition implemented as thin client wrapper imported into server layout.tsx"
  - "ScrollAnimationObserver decommissioned (return null) rather than deleted to avoid import breaks in other pages"
metrics:
  duration: "~20 min"
  completed: "2025-01-01"
  tasks: 2
  files: 7
---

# Phase 01 Plan 03: CTA Animations, Page Transitions, Nav Scroll Effect — Summary

## One-Liner

Animated NGO/Citizens CTA sections with GSAP circle parallax and Framer Motion stagger, added AnimatePresence route transitions via a client wrapper in layout, and a GSAP scroll-driven header shrink effect via SiteHeader.

## What Was Built

### CTASections (`src/app/_components/cta-sections.tsx`)
**NGOCTASection:**
- Outer `<FadeIn direction="up" duration={0.7}>` entrance
- Two decorative circle divs get GSAP `scrub: 2` parallax (`yPercent: ±30`)
- Inner content wrapped in `<FadeIn direction="up" delay={0.2}>`

**CitizensCTASection:**
- Heading block in `<FadeIn direction="up" duration={0.6}>`
- 3 mini-step cards replaced with `<StaggerChildren staggerDelay={0.12}>` + `<StaggerItem>` per card
- CTA button in `<FadeIn direction="up" delay={0.35}>`

### PageTransition (`src/app/_components/page-transition.tsx`)
- `'use client'` wrapper with `AnimatePresence mode="wait"` + `usePathname`
- `motion.div key={pathname}` — `initial: {opacity:0, y:8}` → `animate: {opacity:1, y:0}` → `exit: {opacity:0, y:-8}`
- Duration: 0.25s easeInOut (fast — doesn't feel sluggish)
- Used in `layout.tsx` wrapping `{children}` inside `PostHogProvider`

### SiteHeader (`src/app/_components/site-header.tsx`)
- Extracted from inline header in `hero-section.tsx`
- GSAP `ScrollTrigger.create({ start: 80 })` with `onUpdate`:
  - Scrolled > 80px: `gsap.to(header, { height: 64, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' })`
  - At top: `gsap.to(header, { height: 80, boxShadow: 'none' })`
  - Uses `overwrite: 'auto'` to prevent animation conflicts
- `hero-section.tsx` now imports `<SiteHeader user={user} />` instead of duplicating header JSX

### layout.tsx update
- Added `import { PageTransition } from './_components/page-transition'`
- Children wrapped: `<PageTransition>{children}</PageTransition>`
- `layout.tsx` remains a Server Component (no `'use client'` — metadata exports intact)

### ScrollAnimationObserver.tsx
- Decommissioned: single `return null` with comment
- IntersectionObserver removed — no longer conflicts with GSAP ScrollTrigger
- Kept as module (not deleted) to avoid breaking any remaining imports across other pages

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files confirmed:
- `src/app/_components/cta-sections.tsx` ✅
- `src/app/_components/page-transition.tsx` ✅
- `src/app/_components/site-header.tsx` ✅
- `src/app/_components/hero-section.tsx` (modified) ✅
- `src/app/page.tsx` (modified) ✅
- `src/app/layout.tsx` (modified) ✅
- `src/components/ScrollAnimationObserver.tsx` (decommissioned) ✅
- `pnpm tsc --noEmit` → 0 errors ✅
- `pnpm build` → clean ✅
- Commit: `d96e2b8` ✅
