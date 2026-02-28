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
- [x] 01-01-PLAN.md — Install packages + animation primitive library (`src/components/animations/`) — commit `6e90104`
- [x] 01-02-PLAN.md — Animate hero, stats, steps, features sections of landing page — commit `4497ac0`
- [x] 01-03-PLAN.md — CTA animations, route transitions, nav scroll effects + human verify — commit `d96e2b8`

---

### Phase 2: Report Wizard + AI Scale-Up + NGO Auto-Contact

**Goal:** Transform the single-page report form into a photo-first 2-step wizard. Expand Gemini to auto-fill all report fields from a single image. Build a fully automatic NGO contact pipeline using Google Maps scraping + Bitrix24 CRM.

**Requirements:**
- `REPORT-01` — 2-step wizard: photo+GPS first (Step 1), AI-prefilled form second (Step 2)
- `REPORT-02` — Fix incidents API field schema + add PATCH /api/incidents/[id]
- `REPORT-03` — Unified Gemini analyzer (gemini-2.0-flash) returning animalType, title, description, urgency
- `NGO-01` — Google Maps tbm=map scraper to find nearby animal shelters from incident coordinates
- `NGO-02` — Bitrix24 CRM auto-lead creation + call activity logging for every scraped shelter
- `AI-01` — /api/incidents/[id]/analyze endpoint returns wizard prefill data
- `UI-01` — Report page state machine: capture → analyzing → review → submitted

**Plans:** 4 plans

Plans:
- [ ] 02-01-PLAN.md — Schema migration (NGOOutreach + 6 fields) + Maps scraper + Bitrix24 client
- [ ] 02-02-PLAN.md — Unified Gemini analyzer + /api/incidents/[id]/analyze endpoint
- [ ] 02-03-PLAN.md — notify-external pipeline (scraper → Bitrix24 → DB NGOs)
- [ ] 02-04-PLAN.md — Fix incidents route + 2-step wizard rewrite [checkpoint]
