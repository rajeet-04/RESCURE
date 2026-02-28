---
phase: 01-animations
plan: "02"
subsystem: landing-page-animations
tags: [framer-motion, gsap, scroll-animation, client-components]
dependency_graph:
  requires: [01-01]
  provides: [animated-hero, stats-countup, steps-stagger, features-batch]
  affects: [src/app/page.tsx, src/app/_components/]
tech_stack:
  added: []
  patterns: [use-client-extraction, gsap-context-cleanup, framer-motion-viewport]
key_files:
  created:
    - src/app/_components/hero-section.tsx
    - src/app/_components/stats-section.tsx
    - src/app/_components/steps-section.tsx
    - src/app/_components/features-section.tsx
  modified:
    - src/app/page.tsx
decisions:
  - "stats array changed from string values (toLocaleString) to rawValue numbers for CountUp animation"
  - "header kept inside HeroSection in Plan 01-02 (extracted to SiteHeader in Plan 01-03)"
metrics:
  duration: "~15 min"
  completed: "2025-01-01"
  tasks: 5
  files: 5
---

# Phase 01 Plan 02: Animated Hero, Stats, Steps, Features — Summary

## One-Liner

Extracted four landing page sections into 'use client' components with Framer Motion cascade entrances (hero), GSAP CountUp stats, StaggerChildren step cards, and GSAP ScrollTrigger.batch features grid reveal.

## What Was Built

### HeroSection (`src/app/_components/hero-section.tsx`)
- Framer Motion `FadeIn` cascade: badge (delay 0) → h1 (0.15) → subtitle (0.35) → CTA buttons (0.5)
- Three `useRef` elements on image cards with GSAP `scrub: 1.5` parallax:
  - Left card: `yPercent: -18` (drifts up on scroll)
  - Right card: `yPercent: 18` (drifts down on scroll)
  - Main card: `gsap.from(scale: 0.92, opacity: 0)` entrance

### StatsSection (`src/app/_components/stats-section.tsx`)
- 4 stat cards each in `<FadeIn delay={i * 0.1} direction="up">`
- GSAP `CountUp` animated integer (ScrollTrigger `start: 'top 85%', once: true`)
- Stats array in `page.tsx` changed to `rawValue: number` (was `toLocaleString string`)

### StepsSection (`src/app/_components/steps-section.tsx`)
- `FadeIn` on heading block
- `StaggerChildren staggerDelay={0.15}` wrapping 3 step cards
- Each card in `StaggerItem` — slides up sequentially

### FeaturesSection (`src/app/_components/features-section.tsx`)
- `FadeIn` on heading
- 6 cards with `className="feature-card"` and `gsap.set(cards, { opacity: 0, y: 40 })` initial state
- `ScrollTrigger.batch` reveals cards with `stagger: 0.1` when scrolled into view

## Changes to `src/app/page.tsx`
- Stats: `value: totalReports.toLocaleString('en-IN')` → `rawValue: totalReports`
- Replaced 4 inline section JSX blocks with `<HeroSection>`, `<StatsSection>`, `<StepsSection>`, `<FeaturesSection>`
- Removed unused lucide-react icons, `UserMenu`, `AlertCircle`, `getIcon` function

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files confirmed:
- `src/app/_components/hero-section.tsx` ✅
- `src/app/_components/stats-section.tsx` ✅
- `src/app/_components/steps-section.tsx` ✅
- `src/app/_components/features-section.tsx` ✅
- `src/app/page.tsx` (modified) ✅
- `pnpm tsc --noEmit` → 0 errors ✅
- `pnpm build` → clean ✅
- Commit: `4497ac0` ✅
