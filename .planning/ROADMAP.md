# RESCURE — Roadmap

## Overview

RESCURE is a Next.js 16 / React 18 stray-animal rescue platform. This roadmap tracks planned enhancement phases.

---

### Phase 1: Animations — Dynamic Motion & Scroll UX

**Goal:** Transform the static landing page into a high-fidelity animated experience using Framer Motion (declarative React motion) and GSAP + ScrollTrigger (imperative scroll-coupled animation). Deliver parallax depth, scroll-triggered reveals, staggered entrance sequences, and smooth route transitions.

**Requirements:**
- `ANIM-01` — Install Framer Motion + GSAP; create shared animation primitive components
- `ANIM-02` — Hero section: Framer Motion cascade entrance + GSAP parallax depth on image cards
- `ANIM-03` — Scroll-triggered reveals: GSAP batch stagger for stats count-up, steps, features grid
- `ANIM-04` — CTA sections: GSAP parallax background + Framer Motion whileInView reveals
- `ANIM-05` — Route transitions with Framer Motion AnimatePresence; sticky nav scroll effects

**Plans:** 3 plans

Plans:
- [ ] 01-01-PLAN.md — Install packages + animation primitive library (`src/components/animations/`)
- [ ] 01-02-PLAN.md — Animate hero, stats, steps, features sections of landing page
- [ ] 01-03-PLAN.md — CTA animations, route transitions, nav scroll effects + human verify
